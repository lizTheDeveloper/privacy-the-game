#!/bin/sh
# Record Scout's voice for every listed line that has no recording yet (collective/service/warm.js).
# Run after a deploy that changed mission, step or dialogue text (the deploy syncs the list first):
#
#   scripts/warm-voice.sh --dry-run   # how many lines and characters are missing; spends nothing
#   scripts/warm-voice.sh             # records them, in the background on the box
#   ssh games journalctl -u rc-voice-warm -f    # follow it
#
# Other flags go to warm.js: --max-chars N, --reserve N (default 100000), --concurrency N (2).
# It runs in the rc-collective image with the service's own key, volumes and voice settings,
# without restarting the service. Already-recorded lines are never sent again.
set -eu
cd "$(dirname "$0")/.."
DIR=/opt/reclaim-city-collective/service
# Only warm.js is copied: the rest of the service deploys as DEPLOY.md says, and a stale checkout
# must not overwrite it. The image build picks up the box's own voice.js.
rsync -az collective/service/warm.js "games:$DIR/warm.js"
ssh games "cd $DIR && docker compose build -q rc-collective"
RUN="docker compose run --rm --no-deps -T rc-collective node warm.js $*"
case " $* " in
  *" --dry-run "*) ssh games "cd $DIR && $RUN" ;;
  *)
    if ssh games 'systemctl is-active --quiet rc-voice-warm'; then
      echo 'already running: ssh games journalctl -u rc-voice-warm -f'
      exit 1
    fi
    ssh games "systemctl reset-failed rc-voice-warm 2>/dev/null; systemd-run --unit rc-voice-warm --working-directory $DIR $RUN"
    echo 'started: ssh games journalctl -u rc-voice-warm -f'
    ;;
esac
