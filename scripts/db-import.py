import argparse
from dotenv import load_dotenv
from urllib.parse import urlparse
import mariadb
import os
from importers import get_importers

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', '-e', default='../.env.local', help='env file to load DATABASE_URL from')
    subparsers = parser.add_subparsers(dest='game', help='game importer to use', required=True)
    importers = get_importers()
    for name, importer in importers.items():
        importer.register(subparsers.add_parser(name))

    args = parser.parse_args()
    load_dotenv(args.env)
    parsed = urlparse(os.getenv('DATABASE_URL'))
    conn = mariadb.connect(
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 3306,
        database=parsed.path[1:]
    )

    importer = importers[args.game](conn=conn, **vars(args))
    importer.do_import()
    conn.commit()
    conn.close()
