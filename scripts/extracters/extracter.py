from PyCriCodecs import ACB
import sys
from abc import abstractmethod
from pathlib import Path
import argparse
import subprocess
import yaml
import shutil
import string
import random
import struct
from collections import defaultdict


class Extracter:
    def __init__(self, *, config, out_dir, **kwargs):
        with open(config, 'r') as f:
            self.config = yaml.safe_load(f)
        self.music_enabled = self.config['music']['enable']
        self.jackets_enabled = self.config['jackets']['enable']
        self.images_enabled = self.config['images']['enable']
        self.audio_enabled = self.config['audio']['enable']
        self.out_dir = Path(out_dir)
        self.tmp_dir = self.out_dir / 'tmp'

    def get_tmp(self, ext='.dat'):
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        while True:
            name = ''.join(random.choices(string.ascii_letters + string.digits + '_-+', k=32))
            path = self.tmp_dir / (name + ext)
            if not path.exists():
                try:
                    path.touch(exist_ok=False)
                    return path
                except FileExistsError:
                    pass

    def vgmstream(self, input_file):
        is_tmp = False
        if type(input_file) == bytes:
            tmp = self.get_tmp('.hca')
            is_tmp = True
            with open(tmp, 'wb') as f:
                f.write(input_file)
            input_file = tmp

        args = [
            self.config['vgmstream_path'],
            '-p',
            input_file
        ]

        res = subprocess.run(args, capture_output=True)

        if res.returncode:
            sys.stderr.buffer.write(res.stderr)
            raise RuntimeError(f'vgmstream exited with code {res.returncode}')

        if is_tmp:
            input_file.unlink()

        return res.stdout

    def ffmpeg(self, input_args, media_type, output_name):
        buffer_input = None
        input_args = list(input_args)

        for i, arg in enumerate(input_args):
            if type(arg) == bytes:
                if buffer_input is not None:
                    raise ValueError('more than one buffer passed to ffmpeg input')
                buffer_input = arg
                input_args[i] = '-'
            else:
                input_args[i] = str(arg)

        args = [
            self.config['ffmpeg_path'],
            '-y',
            '-hide_banner',
            '-loglevel',
            'error',
            *input_args,
            *self.config[media_type].get('ffmpeg_args', []),
            Path(output_name).with_suffix(self.config[media_type]['extension'])
        ]

        if buffer_input:
            res = subprocess.run(args, capture_output=True, input=buffer_input)
        else:
            res = subprocess.run(args, capture_output=True)

        if res.returncode:
            sys.stderr.buffer.write(res.stderr)
            raise RuntimeError(f'ffmpeg exited with code {res.returncode}')

    def cleanup(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    @staticmethod
    def acb_filenames(acb: ACB):
        awb_dict: dict[int, dict[int, tuple[int, str]]] = defaultdict(dict)

        payload = acb.payload[0]
        for name_entry in payload['CueNameTable']:
            name = name_entry['CueName'][1]
            index = name_entry['CueIndex'][1]

            sequence = payload['SequenceTable'][index]
            num_tracks = sequence['NumTracks'][1]
            if not num_tracks:
                continue

            track_indexes = struct.unpack(f'>{num_tracks}H', sequence['TrackIndex'][1])
            waveforms = []
            for track_index in track_indexes:
                waveform_index = int.from_bytes(payload['SynthTable'][track_index]['ReferenceItems'][1][2:], 'big')
                waveforms.append(payload['WaveformTable'][waveform_index])

            for i, waveform in enumerate(waveforms):
                awb_index = waveform['StreamAwbPortNo'][1]
                stream_index = waveform['StreamAwbId'][1]
                awb_dict[awb_index][stream_index] = i, name

        return awb_dict

    @abstractmethod
    def extract_jacket(self):
        raise NotImplementedError

    @abstractmethod
    def extract_images(self):
        raise NotImplementedError

    @abstractmethod
    def extract_music(self):
        raise NotImplementedError

    @abstractmethod
    def extract_audio(self):
        raise NotImplementedError

    def extract(self):
        if self.jackets_enabled:
            yield from self.extract_jacket()
        if self.images_enabled:
            yield from self.extract_images()
        if self.music_enabled:
            yield from self.extract_music()
        if self.audio_enabled:
            yield from self.extract_audio()

    @staticmethod
    @abstractmethod
    def register(parser: argparse.ArgumentParser):
        raise NotImplementedError


extracters: dict[str, Extracter] = {}


def add_extracter(extracter):
    extracters[extracter.__name__.lower()] = extracter


def get_extracters():
    return extracters
