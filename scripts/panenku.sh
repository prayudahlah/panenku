#!/bin/bash
set -e

COMPOSE_DIR="$(dirname "$0")/../compose"
ENV_FILE=""

usage() {
    echo "Usage:"
    echo "  $0 dev [up|down|down -v|ps|logs] [--build]"
    echo "  $0 distributed <web|db|be> [up|down|down -v|ps|logs] [--build]"
    exit 1
}

needs_build=false
needs_volumes=false
args=()

for arg in "$@"; do
    if [ "$arg" = "--build" ]; then
        needs_build=true
    elif [ "$arg" = "-v" ] || [ "$arg" = "--volumes" ]; then
        needs_volumes=true
    else
        args+=("$arg")
    fi
done

set -- "${args[@]}"

MODE="$1"
ACTION="${2:-up}"

build_flag=""
$needs_build && build_flag="--build"

volumes_flag=""
$needs_volumes && volumes_flag="-v"

watch_flag=""
case "$MODE" in
    dev)
        ENV_FILE="$(dirname "$0")/../.env.local"
        COMPOSE_FILE="$COMPOSE_DIR/compose.yml"
        if [ "$ACTION" = "up" ]; then
            watch_flag="--watch"
        fi
        ;;
    distributed)
        if [ -z "$2" ]; then
            echo "Error: specify service (web|db|be)"
            usage
        fi
        SERVICE="$2"
        shift
        ENV_FILE="$(dirname "$0")/../.env.distributed"

        case "$SERVICE" in
            web)   COMPOSE_FILE="$COMPOSE_DIR/compose.proxy.yml" ;;
            db)    COMPOSE_FILE="$COMPOSE_DIR/compose.db.yml" ;;
            be)    COMPOSE_FILE="$COMPOSE_DIR/compose.backend.yml" ;;
            *)     echo "Error: unknown service '$SERVICE'"; usage ;;
        esac

        if [ "$ACTION" = "up" ] && [ "$SERVICE" = "be" ]; then
            watch_flag="--watch"
        fi
        ;;
    *)
        usage
        ;;
esac

case "$ACTION" in
    up)
        detach_flag=""
        [ -z "$watch_flag" ] && detach_flag="-d"
        cmd="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up $detach_flag $build_flag $watch_flag"
        echo "→ $cmd"
        eval "$cmd"
        ;;
    down)
        cmd="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down $volumes_flag"
        echo "→ $cmd"
        eval "$cmd"
        ;;
    ps)
        cmd="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps"
        echo "→ $cmd"
        eval "$cmd"
        ;;
    logs)
        cmd="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
        echo "→ $cmd"
        eval "$cmd"
        ;;
    *)
        usage
        ;;
esac
