from abc import abstractmethod
import mariadb
import argparse


class Importer:
    def __init__(self, *, conn: mariadb.Connection, **kwargs):
        conn.autocommit = False
        self.conn = conn
        self.cur = conn.cursor()

    @abstractmethod
    def do_import(self):
        raise NotImplementedError

    @staticmethod
    @abstractmethod
    def register(parser: argparse.ArgumentParser):
        raise NotImplementedError


importers: dict[str, Importer] = {}


def add_importer(importer):
    importers[importer.__name__.lower()] = importer


def get_importers():
    return importers
