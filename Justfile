#!/usr/bin/env -S just --justfile

set dotenv-load
set positional-arguments

# Default command flags
uv_sync := if env("UV_NO_SYNC", "false") == "true" { "--no-sync" } else { "" }

# Get the project name from 'name' in '[project]' in 'pyproject.toml'
project_name := `awk '/^\[project\]/ { proj = 1 } proj && /^name = / { gsub(/"/, "", $3); print $3; exit }' pyproject.toml`

# Print system info and available `just` recipes
_default:
    @echo "This is an {{ arch() }} machine with {{ num_cpus() }} cpu(s), on {{ os() }}."
    @echo "Running: {{ just_executable() }}"
    @echo "   with: {{ justfile() }}"
    @echo "     in: {{ invocation_directory_native() }}"
    @echo ""
    @just --list

# Sync the Python environment, including all dependency groups
[group('environment')]
init-python:
    uv sync --all-groups

# Install the Node environment
[group('environment')]
init-node:
    pnpm ci

# Ensure all package environments are initialised
[group('environment')]
init:
    just init-python
    just init-node

# Nuke the Python environment
[group('environment')]
nuke-python:
    rm -rf .venv .mypy_cache dist

# Nuke the Node environment
[group('environment')]
nuke-node:
    rm -rf node_modules

# Destroy the Python and Node environments
[group('environment')]
scorch:
    just nuke-python
    just nuke-node

# Format the Justfile (Note: Marked as 'Unstable!')
[group('workflow')]
lint-just:
    @just --fmt --unstable
