from history_trim import calculate_context_length, trim_history
from image_validation import valid_image
from key_pool import key_pool
from rate_limit import rate_limiter
from retry_policy import calculate_retry_delay
from validation import valid_client_time, valid_text


def test_validation():
    assert valid_text("hello", 10)
    assert not valid_text("", 10)
    assert not valid_text("a" * 15, 10)
    assert not valid_text("   ", 10)
    assert valid_client_time("Sunday, 20 October 2026")
    assert not valid_client_time("a" * 65)


def test_image_validation():
    assert not valid_image("data:image/gif;base64,1234")
    # minimal valid base64 png
    assert valid_image(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )


def test_history_trim():
    hist = [{"role": "user", "content": "a" * 5000}, {"role": "assistant", "content": "b" * 5000}]
    assert calculate_context_length(hist) == 10000
    # Trim with extra length
    trimmed = trim_history(hist, extra_length=5000)
    assert len(trimmed) == 0


def test_retry_policy():
    assert calculate_retry_delay({"Retry-After": "10"}, 429) == 10
    assert calculate_retry_delay({}, 401) == 3600
    assert calculate_retry_delay({}, 502) == 60


def test_key_pool():
    keys = key_pool.get_keys()
    # just checking type
    assert isinstance(keys, list)


def test_rate_limit():
    # this just tests structure existence
    assert hasattr(rate_limiter, "check_limit")


def test_endpoints():
    from app import app

    client = app.test_client()
    resp = client.get("/")
    assert resp.status_code == 200
    resp_config = client.get("/api/config")
    assert resp_config.status_code == 200
    assert "max_message" in resp_config.json
