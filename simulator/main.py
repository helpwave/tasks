import argparse

from simulator import ClinicSimulator

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="helpwave tasks clinic simulator",
    )
    parser.add_argument(
        "--extreme",
        action="store_true",
        help="Create a large burst of patients at startup to stress test the instance",
    )
    parser.add_argument(
        "--extreme-count",
        type=int,
        default=500,
        help="Number of patients to create at once in extreme mode (default: 500)",
    )
    args = parser.parse_args()

    ClinicSimulator().run(extreme=args.extreme, extreme_count=args.extreme_count)
