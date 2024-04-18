from pathlib import Path
from xml.etree import ElementTree as ET
from itertools import chain
from .importer import Importer, add_importer

BASE_XPATHS = [
    ('./name/id', int),
    './name/str',
    './sortName',
    './image/path'
]

class Chuni(Importer):
    def __init__(self, *, data_dir, opt_dir, **kwargs):
        super().__init__(**kwargs)
        self.data_dir = Path(data_dir)
        self.opt_dir = Path(opt_dir)

    def get_xml(self, folder, name, *xpaths):
        rows = []

        for file in chain(self.data_dir.glob(f'A000/{folder}/*/{name}.xml'),
                          self.opt_dir.glob(f'*/{folder}/*/{name}.xml')):
            print(file)
            tree = ET.parse(file)
            data = []
            for xpath in xpaths:
                if type(xpath) == tuple:
                    xpath, datatype = xpath
                else:
                    datatype = str
                data.append(datatype(tree.find(xpath).text))
            rows.append(tuple(data))

        return rows

    def import_map_icon(self):
        self.cur.executemany(
            '''INSERT INTO actaeon_chuni_static_map_icon(id, name, sortName, imagePath)
            VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE name=name, sortName=sortName, imagePath=imagePath''',
            self.get_xml('mapIcon', 'MapIcon', *BASE_XPATHS)
        )

    def import_name_plate(self):
        self.cur.executemany(
            '''INSERT INTO actaeon_chuni_static_name_plate(id, name, sortName, imagePath)
            VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE name=name, sortName=sortName, imagePath=imagePath''',
            self.get_xml('namePlate', 'NamePlate', *BASE_XPATHS)
        )

    def import_system_voice(self):
        self.cur.executemany(
            '''INSERT INTO actaeon_chuni_static_system_voice(id, name, sortName, imagePath, cuePath)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE name=name, sortName=sortName, imagePath=imagePath, cuePath=cuePath''',
            self.get_xml('systemVoice', 'SystemVoice', *BASE_XPATHS, './cue/str')
        )

    def import_trophies(self):
        self.cur.executemany(
            '''INSERT INTO actaeon_chuni_static_trophies(id, name, rareType, explainText)
            VALUES (%s, %s, %s, %s) ON DUPLICATE KEY UPDATE name=name, rareType=rareType, explainText=explainText''',
            self.get_xml('trophy', 'Trophy', ('./name/id', int), './name/str', ('./rareType', int), './explainText')
        )

    def import_charts(self):
        inserts = []
        for file in chain(self.data_dir.glob(f'A000/music/*/*.c2s'),
                          self.opt_dir.glob(f'*/music/*/*.c2s')):
            print(file)
            data = {}
            song, chart = map(int, file.stem.split('_'))
            if song >= 8000: chart = 5
            with open(file, 'r', encoding='utf8') as f:
                for line in f.readlines():
                    parts = line.strip().split('\t')
                    if len(parts) == 2:
                        data[parts[0]] = parts[1]
            creator = data.get('CREATOR')
            judgeTap = data.get('T_JUDGE_TAP')
            judgeHold = data.get('T_JUDGE_HLD')
            judgeSlide = data.get('T_JUDGE_SLD')
            judgeAir = data.get('T_JUDGE_AIR')
            judgeFlick = data.get('T_JUDGE_FLK')
            judgeAll = data.get('T_JUDGE_ALL')

            if creator is None or judgeTap is None or judgeHold is None or judgeSlide is None or judgeAir is None or judgeFlick is None or judgeAll is None:
                print('warning: chart file missing data')

            inserts.append((song, chart, creator or '', judgeTap or 0, judgeHold or 0, judgeSlide or 0,
                            judgeAir or 0, judgeFlick or 0, judgeAll or 0))
        fields = ['songId', 'chartId', 'chartDesigner', 'tapJudgeCount', 'holdJudgeCount', 'slideJudgeCount',
                  'airJudgeCount', 'flickJudgeCount', 'allJudgeCount']
        self.cur.executemany(
            f'''INSERT INTO actaeon_chuni_static_music_ext({','.join(fields)})
                VALUES ({','.join(['%s'] * len(fields))})
                ON DUPLICATE KEY UPDATE {','.join(f"{f}={f}" for f in fields)}''',
            inserts
        )

    def do_import(self):
        self.import_map_icon()
        self.import_name_plate()
        self.import_system_voice()
        self.import_trophies()
        self.import_charts()

    @staticmethod
    def register(parser):
        parser.add_argument('--data-dir', help='data directory (containing A000)', required=True)
        parser.add_argument('--opt-dir', help='opt directory (containing A001, etc.)', required=True)

add_importer(Chuni)
