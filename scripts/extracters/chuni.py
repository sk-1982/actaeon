from pathlib import Path
from itertools import chain
from PyCriCodecs import AWB, ACB, HCA

from .extracter import Extracter, add_extracter


class Chuni(Extracter):
    def __init__(self, *, data_dir, opt_dir, **kwargs):
        super().__init__(**kwargs)
        self.data_dir = Path(data_dir)
        self.opt_dir = Path(opt_dir)
        self.out_dir /= 'chuni'

    def process_image(self, file: Path, out: Path, media_type):
        out.parent.mkdir(parents=True, exist_ok=True)
        self.ffmpeg(['-i', file], media_type, out)
        print(file)

    def process_music(self, file: Path, out: Path):
        out.parent.mkdir(parents=True, exist_ok=True)
        awb = AWB(str(file))
        # omnimix hca's cannot be decoded by PyCriCodecs
        self.ffmpeg(['-i', self.vgmstream(next(awb.getfiles()))], 'music', out)
        print(file)

    def process_audio(self, hca: bytes, out: Path):
        out.parent.mkdir(parents=True, exist_ok=True)
        self.ffmpeg(['-i', self.vgmstream(hca)], 'audio', out)
        print(out)

    def extract_images(self):
        for folder_name, output_folder in (
                ('avatarAccessory', 'avatar'),
                ('ddsImage', 'character'),
                ('mapIcon', 'map-icon'),
                ('namePlate', 'name-plate'),
                ('systemVoice', 'system-voice-icon')
        ):
            for file in chain(self.data_dir.glob(f'A000/{folder_name}/*/*.dds'),
                              self.opt_dir.glob(f'*/{folder_name}/*/*.dds')):
                yield self.process_image, file, self.out_dir / output_folder / file.name, 'images'

        texture = self.data_dir / 'surfboard' / 'texture'
        yield self.process_image, texture / 'CHU_UI_Common_Avatar_body_00.dds', self.out_dir / 'avatar' / 'CHU_UI_Common_Avatar_body_00.dds', 'images'
        yield self.process_image, texture / 'CHU_UI_title_rank_00_v10.dds', self.out_dir / 'trophy' / 'CHU_UI_title_rank_00_v10.dds', 'images'

    def extract_jacket(self):
        for file in chain(self.data_dir.glob('A000/music/*/*.dds'),
                          self.opt_dir.glob('*/music/*/*.dds')):
            yield self.process_image, file, self.out_dir / 'jacket' / file.name, 'jackets'

    def extract_music(self):
        for file in chain(self.data_dir.glob('A000/cueFile/*/music*.awb'),
                          self.opt_dir.glob('*/cueFile/*/music*.awb')):
            yield self.process_music, file, self.out_dir / 'music' / file.name

    def extract_audio(self):
        for file in chain(self.data_dir.glob('A000/cueFile/*/systemvoice*.acb'),
                          self.opt_dir.glob('*/cueFile/*/systemvoice*.acb')):
            acb = ACB(str(file))
            names = self.acb_filenames(acb)
            for i, data in enumerate(acb.awb.getfiles()):
                yield self.process_audio, data, self.out_dir / 'system-voice' / f'{file.stem}_{names[0][i][1]}'

    @staticmethod
    def register(parser):
        parser.add_argument('--data-dir', help='data directory (containing A000)', required=True)
        parser.add_argument('--opt-dir', help='opt directory (containing A001, etc.)', required=True)


add_extracter(Chuni)
