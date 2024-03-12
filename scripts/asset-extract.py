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
    parser.add_argument('--config', help='asset config', default='assets.yaml')
    parser.add_argument('--processes', type=int, default=cpu_count(), help='number of processes to use')
    parser.add_argument('--out-dir', '--output', help='output directory', default='../public/assets')
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
