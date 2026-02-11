"""
Utility functions for the WAVE experiment setup notebook.
"""

import os
import sys
import time
import threading
import http.server
import socketserver
import webbrowser
from pathlib import Path
from datetime import datetime
from urllib.parse import quote
from typing import Tuple, List, Dict, Any, Optional
from dotenv import load_dotenv
from wave_client import WaveClient
from wave_client.models.base import ExperimentTypeCreate
import pandas as pd


def load_environment_variables(env_file_path: str = ".env") -> Tuple[str, Optional[str], str]:
    """Load and validate environment variables."""
    pwd = os.getcwd()
    print(f"Present working directory: {pwd}")
    print(f"Loading environment variables from {pwd}/{env_file_path}")
    load_dotenv(env_file_path)

    researcher_api_key: Optional[str] = os.getenv("RESEARCHER_API_KEY")
    experimentee_api_key: Optional[str] = os.getenv("EXPERIMENTEE_API_KEY")
    wave_backend_url: Optional[str] = os.getenv("WAVE_BACKEND_URL")

    if not researcher_api_key:
        print(f"❌ RESEARCHER_API_KEY not found in {pwd}, try changing `env_file_path` to get to `tools/.env`")
        sys.exit("Missing API key")
    if not wave_backend_url:
        print(f"❌ WAVE_BACKEND_URL not found  in {pwd}, try changing `env_file_path` to get to `tools/.env`")
        sys.exit("Missing Wave Backend URL")

    return researcher_api_key, experimentee_api_key, wave_backend_url


def load_admin_environment_variables(env_file_path: str = ".env") -> Tuple[str, str]:
    """Load and validate admin environment variables."""
    print(f"Present working directory: {os.getcwd()}")
    print(f"Loading environment variables from {os.getcwd()}/{env_file_path}")
    load_dotenv(env_file_path)

    admin_api_key: Optional[str] = os.getenv("ADMIN_API_KEY")
    wave_backend_url: Optional[str] = os.getenv("WAVE_BACKEND_URL")

    if not admin_api_key:
        print("❌ ADMIN_API_KEY not found, try changing `env_file_path`")
        sys.exit("Missing ADMIN API key")
    if not wave_backend_url:
        print("❌ WAVE_BACKEND_URL not found, try changing `env_file_path`")
        sys.exit("Missing Wave Backend URL")

    return admin_api_key, wave_backend_url


def start_local_server(port: int = 8080, experiment_root: str = "../") -> str:
    """Start HTTP server for local experiment testing."""
    import os

    # Save current directory before any changes
    original_cwd = os.getcwd()
    experiment_root_path: Path = Path(experiment_root).resolve()

    def start_server() -> None:
        # Only change directory within the server thread
        os.chdir(experiment_root_path)
        Handler = http.server.SimpleHTTPRequestHandler
        httpd = socketserver.TCPServer(("", port), Handler)
        httpd.serve_forever()

    print(f"Starting HTTP server at {experiment_root_path}")
    server_thread: threading.Thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(2)  # Give server time to start

    experiment_url: str = f"http://localhost:{port}/"
    try:
        webbrowser.open(experiment_url)
        print("✅ Experiment opened in browser")
        print(f"✅ HTTP server running on localhost:{port}")
    except Exception as e:
        print(f"❌ Failed to open browser: {e}")
        print(f"Please manually open: {experiment_url}")

    return experiment_url


async def get_existing_experiment_types(
    researcher_api_key: str, wave_backend_url: str
) -> List[Dict[str, Any]]:
    """Fetch existing experiment types from WAVE backend."""
    async with WaveClient(api_key=researcher_api_key, base_url=wave_backend_url) as client:
        try:
            experiment_types: List[Dict[str, Any]] = await client.experiment_types.list(
                skip=0, limit=1000
            )
            print(f"\n✅ Connected successfully!")
            print(f"📊 Found {len(experiment_types)} existing experiment types:")

            if experiment_types:
                for exp_type in experiment_types:
                    print(
                        f"  - {exp_type['name']} (table: {exp_type['table_name']}) [ID: {exp_type['id']}]"
                    )
            else:
                print("  (No experiment types found)")

            return experiment_types
        except Exception as e:
            print(f"❌ Error connecting to WAVE backend: {e}")
            sys.exit("Failed to connect to WAVE backend - check API key and URL")


def check_naming_conflicts(
    experiment_type_name: str, table_name: str, existing_experiment_types: List[Dict[str, Any]]
) -> Tuple[bool, Optional[int]]:
    """Check for naming conflicts and return conflict status."""
    existing_names: List[str] = [exp_type["name"] for exp_type in existing_experiment_types]
    existing_table_names: List[str] = [
        exp_type["table_name"] for exp_type in existing_experiment_types
    ]

    skip_creation: bool = False
    existing_id: Optional[int] = None

    if experiment_type_name in existing_names:
        print(f"\n⚠️  Experiment type '{experiment_type_name}' already exists!")
        skip_creation = True
        # Find the existing ID
        for exp_type in existing_experiment_types:
            if exp_type["name"] == experiment_type_name:
                existing_id = exp_type["id"]
                break
        print(f"✅ Will use existing experiment type (ID: {existing_id})")

    elif table_name in existing_table_names:
        print(f"\n❌ Table name '{table_name}' already exists!")
        print("💡 Please modify the 'table_name' variable and re-run")
        sys.exit("Table name conflict - choose a different table name")

    else:
        print(f"\n✅ Experiment type '{experiment_type_name}' is available")
        print(f"✅ Table name '{table_name}' is available")
        print("📝 Will create new experiment type")

    return skip_creation, existing_id


async def create_experiment_type(
    experiment_type_data: ExperimentTypeCreate, researcher_api_key: str, wave_backend_url: str
) -> Dict[str, Any]:
    """Create new experiment type in WAVE backend."""
    async with WaveClient(api_key=researcher_api_key, base_url=wave_backend_url) as client:
        try:
            exp_type: Dict[str, Any] = await client.experiment_types.create(
                name=experiment_type_data.name,
                table_name=experiment_type_data.table_name,
                description=experiment_type_data.description,
                schema_definition=experiment_type_data.schema_definition,
            )
            return exp_type
        except Exception as e:
            print(f"❌ Error creating experiment type: {e}")
            raise


def generate_test_identifiers(experiment_type_name: str) -> Tuple[str, str]:
    """Generate unique test experiment name and participant ID."""
    import uuid

    timestamp: str = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_experiment_name: str = f"TEST_{experiment_type_name}_{timestamp}"
    test_experimentee_id: str = f"test_participant_{uuid.uuid4().hex[:8]}"
    return test_experiment_name, test_experimentee_id


async def get_existing_tags(researcher_api_key: str, wave_backend_url: str) -> List[Dict[str, Any]]:
    """Fetch existing tags from WAVE backend."""
    async with WaveClient(api_key=researcher_api_key, base_url=wave_backend_url) as client:
        try:
            existing_tags: List[Dict[str, Any]] = await client.tags.list(skip=0, limit=1000)
            return existing_tags
        except Exception as e:
            print(f"❌ Error fetching existing tags: {e}")
            raise


def check_tags_to_create(
    experiment_tags: List[Dict[str, str]], existing_tags: List[Dict[str, Any]]
) -> List[Dict[str, str]]:
    """Determine which tags need to be created."""
    existing_tag_names: List[str] = [tag["name"] for tag in existing_tags]
    existing_tag_names_set: set[str] = set(existing_tag_names)

    tags_to_create: List[Dict[str, str]] = []
    for tag in experiment_tags:
        if tag["name"] not in existing_tag_names_set:
            tags_to_create.append(tag)

    return tags_to_create


async def create_missing_tags(
    tags_to_create: List[Dict[str, str]], researcher_api_key: str, wave_backend_url: str
) -> List[Dict[str, Any]]:
    """Create missing tags in WAVE backend."""
    async with WaveClient(api_key=researcher_api_key, base_url=wave_backend_url) as client:
        created_tags: List[Dict[str, Any]] = []
        for tag in tags_to_create:
            try:
                created_tag: Dict[str, Any] = await client.tags.create(
                    name=tag["name"], description=tag["description"]
                )
                created_tags.append(created_tag)
                print(f"  ✅ Created tag: {created_tag['name']} [ID: {created_tag['id']}]")
            except Exception as e:
                print(f"  ❌ Failed to create tag '{tag['name']}': {e}")
                raise
        return created_tags


async def create_experiment(
    description: str,
    experiment_type_id: int,
    tags: List[str],
    researcher_api_key: str,
    wave_backend_url: str,
    additional_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create an experiment with the given parameters."""
    async with WaveClient(api_key=researcher_api_key, base_url=wave_backend_url) as client:
        try:
            if additional_data is None:
                additional_data = {"created_by": "python_notebook"}

            experiment: Dict[str, Any] = await client.experiments.create(
                experiment_type_id=experiment_type_id,
                description=description,
                tags=tags,
                additional_data=additional_data,
            )
            return experiment

        except Exception as e:
            print(f"❌ Error creating experiment: {e}")
            raise


def create_experiment_url(
    base_url: str, 
    experiment_id: str,
    experimentee_api_key: Optional[str], 
    participant_id: Optional[str], 
) -> Tuple[str, str]:
    """Create full experiment URL with WAVE integration parameters."""
    if not experimentee_api_key:
        print("❌ EXPERIMENTEE_API_KEY not found in tools/.env file")
        sys.exit("Missing EXPERIMENTEE API key")

    if participant_id:
        full_url: str = (
            f"{base_url}"
            f"?key={quote(experimentee_api_key)}"
            f"&experiment_id={quote(experiment_id)}"
            f"&participant_id={quote(participant_id)}"
        )
    else:
        full_url: str = (
            f"{base_url}"
            f"?key={quote(experimentee_api_key)}"
            f"&experiment_id={quote(experiment_id)}"
        )

    censored_url: str = full_url.replace(experimentee_api_key, "[EXPERIMENTEE_API_KEY_HIDDEN]")
    return full_url, censored_url


async def get_experiment_data(
    experiment_id: str, researcher_api_key: str, wave_backend_url: str
) -> pd.DataFrame:
    """Retrieve experiment data from WAVE backend."""
    async with WaveClient(api_key=researcher_api_key, base_url=wave_backend_url) as client:
        try:
            data_df: pd.DataFrame = await client.experiment_data.get_all_data(
                experiment_id=experiment_id
            )
            return data_df
        except Exception as e:
            print(f"❌ Error retrieving experiment data: {e}")
            raise




def get_user_confirmation(prompt: str, exit_message: Optional[str] = None) -> bool:
    """Get yes/no confirmation from user with optional exit handling."""
    print("Please enter your feedback to continue.")
    response: str = input(f"{prompt} (y/n): ").strip().lower()

    if response not in ["y", "yes"]:
        if exit_message:
            print(f"❌ {exit_message}")
            sys.exit("User cancelled")
        return False
    return True


def print_schema_info() -> None:
    """Print information about schema validation rules."""
    print("### Schema Validation Rules")
    print("\n**Reserved Column Names** (cannot be used in your schema):")
    print("- `id` - Auto-generated primary key")
    print("- `experiment_uuid` - Links data to experiment")
    print("- `participant_id` - Participant identifier (added automatically)")
    print("- `created_at` - Timestamp when data was created")
    print("- `updated_at` - Timestamp when data was last modified")

    print("\n**Supported Data Types**:")
    print("- `INTEGER` - Whole numbers (e.g., trial numbers, counts)")
    print("- `FLOAT` - Decimal numbers (e.g., reaction times, scores)")
    print("- `STRING` - Text up to 255 characters (e.g., responses, stimulus names)")
    print("- `TEXT` - Longer text content (unlimited length)")
    print("- `BOOLEAN` - True/false values (e.g., accuracy, conditions)")
    print("- `DATETIME` - Date and time stamps")
    print("- `JSON` - Complex structured data")

    print("\n**Important Notes**:")
    print("- STRING fields are capped at 255 characters - use TEXT for longer content")
    print("- Column names are case-sensitive and should match exactly")
    print("- Field names cannot conflict with reserved names above")
