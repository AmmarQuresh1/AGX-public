import random
from agx.compiler import compile_plan
from agx.registries.devops_test import registry

def test_simple_function_call():
    """Test basic function call generation"""
    plan = [{"function": "log_message", "args": {"message": "Hello"}}]
    code = compile_plan(plan)
    
    assert "def log_message(message: str) -> None:" in code
    assert "log_message(message='Hello')" in code
    assert 'if __name__ == "__main__":' in code

def test_function_with_assignment():
    """Test function call with variable assignment"""
    plan = [{"function": "set_bucket_name", "args": {"name": "agx-demo-123"}, "assign": "bucket_name"}]
    code = compile_plan(plan)
    
    assert "bucket_name = set_bucket_name(name='agx-demo-123')" in code

def test_variable_reference():
    """Test {variable} substitution in strings with registry functions"""
    plan = [
        {"function": "set_bucket_name", "args": {"name": "agx-demo-123"}, "assign": "bucket"},
        {"function": "log_message", "args": {"message": "Bucket: {bucket}"}}
    ]
    code = compile_plan(plan)
    
    assert "bucket = set_bucket_name(name='agx-demo-123')" in code
    assert 'log_message(message=f"Bucket: {bucket}")' in code

def test_function_deduplication():
    """Test that duplicate functions aren't included twice"""
    plan = [
        {"function": "log_message", "args": {"message": "First"}},
        {"function": "log_message", "args": {"message": "Second"}}
    ]
    code = compile_plan(plan)
    
    # Should only have one function definition
    assert code.count("def log_message(") == 1
    # Should have both calls
    assert "log_message(message='First')" in code
    assert "log_message(message='Second')" in code

def test_multiple_data_types():
    """Test different argument types are handled correctly"""
    plan = [{"function": "aws_s3_bucket_public_access_block", "args": {"bucket_name": "agx-demo-123", "block_all_public": True}}]
    code = compile_plan(plan)
    
    assert "aws_s3_bucket_public_access_block(bucket_name='agx-demo-123', block_all_public=True)" in code

def test_empty_plan():
    """Test empty plan generates valid code"""
    plan = []
    code = compile_plan(plan)
    
    assert "def main():" in code
    assert 'if __name__ == "__main__":' in code

def test_generated_code_is_executable():
    """Test that generated code can be executed without errors"""
    plan = [{"function": "set_bucket_name", "args": {"name": "agx-demo-123"}, "assign": "result"}]
    code = compile_plan(plan)
    
    # This should not raise any exceptions
    compile(code, '<string>', 'exec')

def test_complex_plan():
    """Test a multi-step plan with variables"""
    plan = [
        {"function": "set_bucket_name", "args": {"name": "agx-a"}, "assign": "b1"},
        {"function": "set_bucket_name", "args": {"name": "agx-b"}, "assign": "b2"}, 
        {"function": "log_message", "args": {"message": "First: {b1}, Second: {b2}"}}
    ]
    code = compile_plan(plan)
    
    assert "b1 = set_bucket_name(name='agx-a')" in code
    assert "b2 = set_bucket_name(name='agx-b')" in code
    assert 'log_message(message=f"First: {b1}, Second: {b2}")' in code