from pathlib import Path
from agx.validate_plan import validate_plan
from agx.compiler import compile_plan

EXAMPLE_PLAN = [
    {"function": "set_bucket_name", "args": {"name": "my-demo-bucket"}, "assign": "bucket_name"},
    {"function": "create_aws_s3_bucket", "args": {"label": "demo_bucket", "bucket_name": "{bucket_name}"}, "assign": "bucket_id"},
    {"function": "aws_s3_bucket_public_access_block", "args": {"label": "demo_bucket", "block_all_public": True}, "assign": "pab_id"},
    {"function": "save_hcl_to_file", "args": {"hcl_content": "{bucket_id}\\n{pab_id}", "filename": "main.tf"}}
]

def test_valid_example_plan():
    # Should raise no errors
    assert validate_plan(EXAMPLE_PLAN) is True


def test_missing_function():
    bad = [{"function": "nonexistent_func", "args": {"x": 1}}]
    assert validate_plan(bad) is False


def test_variable_before_assignment():
    bad = [{"function": "log_message", "args": {"message": "{undefined_var}"}}]
    assert validate_plan(bad) is False


def test_e2e_creates_main_tf():

    # Validate IR
    assert validate_plan(EXAMPLE_PLAN) is True

    # Compile to py code and run
    code = compile_plan(EXAMPLE_PLAN)
    print(code)
    exec(code, {'__name__': '__main__'})

    # Assert file and content
    tf = Path("main.tf")
    assert tf.exists()
    content = tf.read_text(encoding="utf-8")
    assert "aws_s3_bucket" in content
    assert "aws_s3_bucket_public_access_block" in content