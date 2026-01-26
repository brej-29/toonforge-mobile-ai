from __future__ import annotations

from cartoonizer import main


def test_cli_help_exits_cleanly() -> None:
    code = main(["--help"])
    assert code in (0, 1)
