import argparse
import traceback
from extracters import get_extracters
from multiprocessing import cpu_count
from concurrent.futures import ProcessPoolExecutor
from multiprocessing import Manager

def run(event, func, args):
    if event.is_set():
        return

    try:
        func(*args)
    except:
        event.set()
        traceback.print_exc()
        raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', help='asset config (default=assets.yaml)', default='assets.yaml')
    parser.add_argument('--processes', type=int, default=cpu_count(), help=f'number of processes to use (default={cpu_count()})')
    parser.add_argument('--out-dir', '--output-dir', '--output', '-o', help='output directory (default=../public/assets)', default='../public/assets')
    parser.add_argument('--no-overwrite', '-n', help='don\'t overwrite exising files', action='store_true')
    parser.add_argument('--no-music', help='don\'t process music files', action='store_true')
    parser.add_argument('--no-audio', help='don\'t process other audio files', action='store_true')
    parser.add_argument('--no-jackets', help='don\'t process jacket images', action='store_true')
    parser.add_argument('--no-images', help='don\'t process other images', action='store_true')
    subparsers = parser.add_subparsers(dest='game', help='game extracter to use', required=True)
    extracters = get_extracters()
    for name, extracter in extracters.items():
        extracter.register(subparsers.add_parser(name))

    args = parser.parse_args()
    extracter = extracters[args.game](**vars(args))

    if args.processes == 1:
        for func, *args in extracter.extract():
            func(*args)
    else:
        with Manager() as manager:
            event = manager.Event()
            with ProcessPoolExecutor(args.processes) as executor:
                for func, *args in extracter.extract():
                    executor.submit(run, event, func, args)

    extracter.cleanup()
