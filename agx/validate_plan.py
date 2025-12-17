"""
validate_plan.py

Comprehensive JSON plan validation system for AGX

This module validates JSON execution plans before they're processed for the
executor or compiler, catching errors early to prevent runtime failures.

Current validations:
Function existence - ensures all functions exist in the registry
Parameter validation - checks names, types, and type hints match function signatures
Required parameters - ensures all mandatory function parameters are provided
Type enforcement - validates argument types match function type hints
Variable references - prevents use of variables before assignment
Return type hints - ensures all functions have proper return annotations

Future enhancements (post-MVP):
- Circular reference detection for complex variable dependencies  
- Duplicate assignment prevention for cleaner generated code

Usage:
if plan is valid then proceed with execution/compilation
else plan has errors, fix before proceeding (hybrid confidence for retries)
"""

import re
from .registries.devops_test import registry # Change registry here
import inspect
from inspect import signature
from typing import get_origin
import typing

def _is_basic_type(type_hint):
    # only allows for simple types for isinstance checks
    return get_origin(type_hint) is None

def _check_type(value, type_hint):
    # Accept Any and unknown typing forms without strict checks
    try:
        if str(type_hint) == 'typing.Any' or type_hint is typing.Any:
            return True
        if _is_basic_type(type_hint) and isinstance(type_hint, type):
            return isinstance(value, type_hint)
    except Exception:
        return True
    # Fallback: don't block on complex hints in the demo
    return True

def validate_plan(plan):
    assigned_vars = set()  # Keeps track of all variables that get assigned values
    errors = []            # Collects any validation errors found

    for i, step in enumerate(plan):
        fn = step.get("function")
        args = step.get("args", {})
        assign = step.get("assign")

        # FUNCTION EXISTENCE CHECK 
        # Only valid function names can be used
        if fn not in registry:
            errors.append(f"[Plan Error] Step {i+1}: Function '{fn}' does not exist.")
            continue # Skip validation for non existent functions

        # PARAMETER AND TYPE VALIDATION 
        sig = signature(registry[fn])

        # Check each provided argument against function parameters
        for arg_name, arg_value in args.items():
            if arg_name not in sig.parameters:
                errors.append(f"[Plan Error] Step {i+1}: Unknown parameter '{arg_name}' for function '{fn}'")
                continue
            
            param = sig.parameters[arg_name]
            
            # Check type hint exists
            if param.annotation is inspect.Parameter.empty:
                errors.append(f"[Plan Error] Step {i+1}: Parameter '{param.name}' in '{fn}' lacks type hint.")
            
            # Check type compatibility
            elif not _check_type(arg_value, param.annotation):
                errors.append(f"[Plan Error] Step {i+1}: Incorrect type for parameter '{param.name}' in '{fn}'")

        # Check return type hint
        if sig.return_annotation is inspect.Parameter.empty:
            errors.append(f"[Plan Error] Step {i+1}: Function '{fn}' lacks return type hint.")    

        # REQUIRED PARAMETER CHECK 
        provided_params = set(args.keys())
        for param_name, param in sig.parameters.items():
            if (param.default == inspect.Parameter.empty and 
                param_name not in provided_params):
                errors.append(f"[Plan Error] Step {i+1}: Missing required parameter '{param_name}' for function '{fn}'")

        # VARIABLE REFERENCE VALIDATION 
        # Check if any arguments reference variables (format: {variable_name})
        for k, v in args.items():
            if isinstance(v, str) and re.match(r"^{.*}$", v): 
                matches = re.findall(r"\{[^{}]*\}", v)
                for pair in matches:
                    var_name = pair[1:-1] # Remove the outer curly brace of step
                    if var_name not in assigned_vars:
                        errors.append(f"[Plan Error] Step {i+1}: Variable '{var_name}' used in argument '{k}' before assignment.")

        #  TRACK ASSIGNMENTS 
        # Track this step's assigned variable for future steps
        if assign:
            assigned_vars.add(assign)

    # RETURN RESULTS 
    if errors:
        print("[AGX Validator] Plan validation failed:")
        for error in errors:
            print(error)
        return False

    print("[AGX Validator] Plan validation passed.")
    return True
