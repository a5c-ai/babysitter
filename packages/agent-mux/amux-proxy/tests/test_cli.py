from __future__ import annotations
from click.testing import CliRunner
from amux_proxy.cli import main


def test_version_flag() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--version"])
    assert result.exit_code == 0
    from amux_proxy import __version__

    assert __version__ in result.output


def test_missing_required_args() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--target-provider", "openai"])
    # Should fail validation (missing target-model and transport)
    assert result.exit_code != 0


def test_missing_target_model() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--target-provider", "openai", "--transport", "anthropic"])
    # Missing target-model
    assert result.exit_code != 0


def test_missing_transport() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--target-provider", "openai", "--target-model", "openai/gpt-4o"])
    # Missing transport
    assert result.exit_code != 0


def test_invalid_transport() -> None:
    runner = CliRunner()
    result = runner.invoke(
        main,
        [
            "--target-provider",
            "openai",
            "--target-model",
            "openai/gpt-4o",
            "--transport",
            "invalid-transport",
        ],
    )
    assert result.exit_code != 0
    assert "Invalid transport" in result.output


def test_help_flag() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--help"])
    assert result.exit_code == 0
    assert "amux-proxy" in result.output
