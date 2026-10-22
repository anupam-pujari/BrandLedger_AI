"""
Pytest configuration and shared test fixtures for BrandProof Backend.
"""

import sys
from pathlib import Path
import pytest

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from tests.sample_data.seed_demo_data import (
    load_sample_rules,
    load_sample_facts,
    load_sample_terms,
    load_sample_palette,
    load_sample_drafts,
)


@pytest.fixture
def sample_rules():
    return load_sample_rules()


@pytest.fixture
def sample_facts():
    return load_sample_facts()


@pytest.fixture
def sample_terms():
    return load_sample_terms()


@pytest.fixture
def sample_palette():
    return load_sample_palette()


@pytest.fixture
def sample_drafts():
    return load_sample_drafts()
