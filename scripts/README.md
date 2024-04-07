# Scripts

These supporting scripts are used to convert game assets and import information into the database.

### Installing Dependencies
1. Create a virtualenv by running `py -m venv venv`
2. Run `.\venv\scripts\activate`
3. Install dependencies by running `pip install -r requirements.txt`
4. Before running any script, make sure the virtualenv is activated by running `.\venv\scripts\activate`

# Asset Extractor
Usage: `py asset-extract.py [options] <game> [game_options]`

### Prerequisites
You must specify the path to these executables inside `paths.yaml` if they are not already on your path. 
1. [`ffmpeg`](https://ffmpeg.org/download.html)
2. [`vgmstream-cli`](https://vgmstream.org/)

### Asset Configs
You can customize the file extension and ffmpeg arguments of generated files through an `assets.yaml` file. Some exiting assets configs have already been provided. Read the comment in the first line of the file to decide which one you want to use.

### Options
These options must be specified before the `game` argument

| Flag                                    | Description                                                                                                                                                | Default                        |
|-----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------|
| `--config`                              | Asset config file                                                                                                                                          | `assets.fast.yaml`             |
| `--paths`                               | Paths config file                                                                                                                                          | `paths.yaml`                   |
| `--processes`                           | Number of processes to use when converting                                                                                                                 | Number of cores on your system |
| `-o, --output, --out-dir, --output-dir` | Output directory                                                                                                                                           | `../public/assets`             |
| `-n, --no-overwrite`                    | If set, don't overwrite existing files.  (Note: if the script is terminated early, it may leave broken assets that need to be deleted if this flag is set) | (Unset)                        |
| `--no-music`                            | If set, don't generate music files                                                                                                                         | (Unset)                        |
| `--no-audio`                            | If set, don't generate other audio files (system voice, etc)                                                                                               | (Unset)                        |
| `--no-jackets`                          | If set, don't generate jacket images                                                                                                                       | (Unset)                        |
| `--no-images`                           | If set, don't generate other images (avatar images, etc)                                                                                                   | (Unset)                        |

## Chunithm Extractor
Usage: `py asset-extract.py [options] chuni --data-dir DATA_DIR --opt-dir OPT_DIR`
### Options
These options must be specified after `chuni`

| Flag         | Description                                                 |
|--------------|-------------------------------------------------------------|
| `--data-dir` | Path to data directory, containing A000 (required)          |
| `--opt-dir`  | Path to options directory, containing A001, etc. (required) |

#### Example Usage
`py asset-extract.py -n --config assets.fast.yaml chuni --data-dir C:\chuni\app\data --opt-dir C:\chuni\option`

# Database Importer
Usage: `py db-importer.py [options] <game> [game_options]`

The database importer requires the `DATABASE_URL` environment variable to be set, which can be set in an `.env` file in the format `DATABASE_URL=mysql://user:pass@host:port/db_name` (see the `--env` option)

# **WARNING: Back up your database**
I am not responsible for misconfigurations that lead to database issues. **You should back up your database before making any changes to it.**

### Options
These options must be specified before the `game` argument

| Flag        | Description                                              | Default         |
|-------------|----------------------------------------------------------|-----------------|
| `--env, -e` | Path to `.env` file to load `DATABASE_URL` variable from | `../.env.local` |

## Chunithm Importer
Usage: `py db-importer.py [options] chuni --data-dir DATA_DIR --opt-dir OPT_DIR`

### Options
These options must be specified after `chuni`

| Flag         | Description                                                 |
|--------------|-------------------------------------------------------------|
| `--data-dir` | Path to data directory, containing A000 (required)          |
| `--opt-dir`  | Path to options directory, containing A001, etc. (required) |

#### Example Usage
`py db-import.py -e ../.env.local chuni --data-dir C:\chuni\app\data --opt-dir C:\chuni\option`
