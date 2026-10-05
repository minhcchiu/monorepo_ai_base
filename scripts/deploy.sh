#!/usr/bin/env bash
#
# Deploy pp09base (backend + web-admin) lên server qua SSH.
#
#   ./scripts/deploy.sh --help
#
# Cấu hình nằm ở scripts/deploy.local.env (không vào git).
# Tạo lần đầu: cp scripts/deploy.env.example scripts/deploy.local.env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/deploy.local.env"
EXAMPLE_FILE="$SCRIPT_DIR/deploy.env.example"

TARGET="both"   # both | backend | admin
FULL=0
ASSUME_YES=0
MODE="deploy"   # deploy | preview | status | logs
LOG_APP=""

usage() {
  cat <<'EOF'
Deploy pp09base lên server qua SSH.

  ./scripts/deploy.sh [tuỳ chọn]

Tuỳ chọn:
  (không cờ)          xem trước → hỏi xác nhận → deploy backend + web-admin
  --only backend      chỉ deploy backend
  --only admin        chỉ deploy web-admin
  --full              xoá dist/.next trước khi build (chữa build bẩn, trắng trang)
  --yes, -y           bỏ bước hỏi xác nhận
  --dry-run           chỉ xem trước rồi thoát, không đụng gì tới server
  --status            in pm2 status + prisma migrate status
  --logs [tên]        xem 100 dòng log PM2 gần nhất (mặc định backend)
  --help, -h          in hướng dẫn này

Thứ tự khi deploy:
  git pull → pnpm install → prisma generate → prisma migrate deploy
  → build → pm2 startOrReload → pm2 save

Cấu hình: scripts/deploy.local.env (tạo từ scripts/deploy.env.example).
EOF
}

die() { echo "❌ $*" >&2; exit 1; }

# ---------- đọc tham số (làm trước khi nạp env để --help luôn chạy được) ----------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)
      [[ $# -ge 2 ]] || die "--only cần giá trị: backend hoặc admin"
      TARGET="$2"; shift 2 ;;
    --full)     FULL=1; shift ;;
    --yes|-y)   ASSUME_YES=1; shift ;;
    --dry-run)  MODE="preview"; shift ;;
    --status)   MODE="status"; shift ;;
    --logs)
      MODE="logs"; shift
      if [[ $# -gt 0 && "$1" != --* ]]; then LOG_APP="$1"; shift; fi ;;
    --help|-h)  usage; exit 0 ;;
    *)          echo "Tuỳ chọn không hiểu: $1" >&2; echo >&2; usage >&2; exit 1 ;;
  esac
done

case "$TARGET" in
  both|backend|admin) ;;
  *) die "--only chỉ nhận 'backend' hoặc 'admin', nhận được: $TARGET" ;;
esac

# ---------- nạp cấu hình ----------
if [[ ! -f "$ENV_FILE" ]]; then
  cat >&2 <<EOF
❌ Chưa có file cấu hình: $ENV_FILE

Tạo bằng:
  cp "$EXAMPLE_FILE" "$ENV_FILE"
  chmod 600 "$ENV_FILE"

rồi điền SSH_HOST / SSH_USER / SSH_KEY vào đó.
EOF
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

for v in SSH_HOST SSH_USER REMOTE_PATH; do
  [[ -n "${!v:-}" ]] || die "Thiếu biến $v trong $ENV_FILE"
done

SSH_PORT="${SSH_PORT:-22}"
REPO_BRANCH="${REPO_BRANCH:-main}"
PM2_BACKEND="${PM2_BACKEND:-pp09base-backend}"
PM2_ADMIN="${PM2_ADMIN:-pp09base-web-admin}"
[[ -n "$LOG_APP" ]] || LOG_APP="$PM2_BACKEND"

SSH_OPTS=(-p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "${SSH_KEY/#\~/$HOME}")
fi

# Nối các mảnh script lại, mỗi mảnh một dòng riêng.
# BẮT BUỘC dùng hàm này thay vì "$(prelude)$BODY": $( ) cắt mất newline cuối, làm
# dòng cuối của mảnh trước dính liền dòng đầu của mảnh sau (`LOG_APP=xcd /home/...`)
# — dạng đó vẫn hợp lệ cú pháp nên `bash -n` không bắt được, chỉ hỏng lúc chạy.
compose() {
  local part
  for part in "$@"; do printf '%s\n' "$part"; done
}

# Chạy một đoạn bash trên server. Tham số $1 là toàn bộ script.
remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" bash -s <<<"$1"
}

# Các biến cấu hình được nhúng vào đầu script remote, đã quote an toàn.
prelude() {
  printf 'set -euo pipefail\n'
  printf 'REMOTE_PATH=%q\nREPO_BRANCH=%q\nPM2_BACKEND=%q\nPM2_ADMIN=%q\nTARGET=%q\nFULL=%q\nLOG_APP=%q\n' \
    "$REMOTE_PATH" "$REPO_BRANCH" "$PM2_BACKEND" "$PM2_ADMIN" "$TARGET" "$FULL" "$LOG_APP"
}

# Guard chung cho mọi thao tác cần repo: script này CHỈ deploy lại, không cài lần đầu.
GUARD_REPO=$(cat <<'EOS'
if [ ! -d "$REMOTE_PATH/.git" ]; then
  echo "❌ Chưa có repo tại $REMOTE_PATH trên server." >&2
  echo "   Script này chỉ deploy LẠI, không làm phần cài đặt lần đầu." >&2
  echo "   Chạy phần 'Bước 0 → Lệnh 3' trong ai_prompts/00.deploy.md trước." >&2
  exit 2
fi
EOS
)

BODY_PREVIEW=$(cat <<'EOS'
cd "$REMOTE_PATH"
echo "=== Repo: $REMOTE_PATH (branch $REPO_BRANCH) ==="
git fetch --quiet origin "$REPO_BRANCH"
echo "Đang chạy : $(git rev-parse --short HEAD)  $(git log -1 --pretty=%s)"
echo "Sẽ deploy : $(git rev-parse --short "origin/$REPO_BRANCH")  $(git log -1 --pretty=%s "origin/$REPO_BRANCH")"
echo
echo "=== Commit sẽ kéo về ==="
if [ -z "$(git log --oneline "HEAD..origin/$REPO_BRANCH")" ]; then
  echo "(không có commit mới — server đã ở bản mới nhất)"
else
  git log --oneline "HEAD..origin/$REPO_BRANCH"
fi
echo
echo "=== Migration (trạng thái DB hiện tại) ==="
cd "$REMOTE_PATH/apps/backend"
npx prisma migrate status || true
echo
echo "=== PM2 ==="
pm2 status
EOS
)

BODY_APPLY=$(cat <<'EOS'
cd "$REMOTE_PATH"
echo "==> git pull"
git pull --ff-only origin "$REPO_BRANCH"
echo "==> pnpm install"
pnpm install --frozen-lockfile

if [ "$TARGET" = "both" ] || [ "$TARGET" = "backend" ]; then
  cd "$REMOTE_PATH/apps/backend"
  echo "==> backend: prisma generate"
  pnpm db:generate
  echo "==> backend: prisma migrate deploy"
  pnpm db:migrate
  if [ "$FULL" = "1" ]; then echo "==> backend: xoá dist"; rm -rf dist; fi
  echo "==> backend: build"
  pnpm build
fi

if [ "$TARGET" = "both" ] || [ "$TARGET" = "admin" ]; then
  cd "$REMOTE_PATH/apps/web-admin"
  if [ "$FULL" = "1" ]; then echo "==> web-admin: xoá .next"; rm -rf .next; fi
  echo "==> web-admin: build"
  pnpm build
fi

cd "$REMOTE_PATH"
echo "==> pm2 startOrReload"
# Dùng if/elif chứ KHÔNG dùng `case`: pattern kiểu `both)` có dấu ) lẻ, mà đoạn này
# nằm trong heredoc lồng trong $(...) — bash 3.2 (macOS) sẽ tưởng $( ) đã đóng.
if [ "$TARGET" = "backend" ]; then
  pm2 startOrReload ecosystem.config.js --only "$PM2_BACKEND"
elif [ "$TARGET" = "admin" ]; then
  pm2 startOrReload ecosystem.config.js --only "$PM2_ADMIN"
else
  pm2 startOrReload ecosystem.config.js
fi
pm2 save
echo
pm2 status
EOS
)

BODY_STATUS=$(cat <<'EOS'
cd "$REMOTE_PATH"
echo "=== Commit đang chạy ==="
git log -1 --oneline
echo
echo "=== Migration ==="
cd "$REMOTE_PATH/apps/backend"
npx prisma migrate status || true
echo
echo "=== PM2 ==="
pm2 status
EOS
)

BODY_LOGS=$(cat <<'EOS'
pm2 logs "$LOG_APP" --lines 100 --nostream
EOS
)

# ---------- kiểm tra kết nối ----------
if ! ssh "${SSH_OPTS[@]}" -o BatchMode=yes "$SSH_USER@$SSH_HOST" true 2>/dev/null; then
  die "Không SSH được tới $SSH_USER@$SSH_HOST:$SSH_PORT.
   Kiểm tra SSH_HOST/SSH_PORT/SSH_KEY trong $ENV_FILE.
   Nếu server mới chỉ có mật khẩu: ssh-copy-id -p $SSH_PORT $SSH_USER@$SSH_HOST"
fi

case "$MODE" in
  status) remote "$(compose "$(prelude)" "$GUARD_REPO" "$BODY_STATUS")"; exit 0 ;;
  logs)   remote "$(compose "$(prelude)" "$BODY_LOGS")";   exit 0 ;;
esac

# ---------- pha 1: xem trước ----------
echo "───────── XEM TRƯỚC (chưa thay đổi gì trên server) ─────────"
remote "$(compose "$(prelude)" "$GUARD_REPO" "$BODY_PREVIEW")"
echo "────────────────────────────────────────────────────────────"

if [[ "$MODE" == "preview" ]]; then
  echo "(--dry-run: dừng ở đây)"
  exit 0
fi

# ---------- xác nhận ----------
case "$TARGET" in
  both)    what="backend + web-admin" ;;
  backend) what="backend" ;;
  admin)   what="web-admin" ;;
esac
if [[ "$FULL" == "1" ]]; then what="$what (build sạch)"; fi

if [[ "$ASSUME_YES" != "1" ]]; then
  if [[ ! -t 0 ]]; then
    die "Cần xác nhận nhưng không có terminal. Chạy lại kèm --yes nếu đã chắc chắn."
  fi
  printf 'Deploy %s lên %s? [y/N] ' "$what" "$SSH_HOST"
  read -r answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    echo "Đã huỷ. Server không bị thay đổi."
    exit 0
  fi
fi

# ---------- pha 2: deploy ----------
echo "───────── DEPLOY $what ─────────"
remote "$(compose "$(prelude)" "$GUARD_REPO" "$BODY_APPLY")"
echo "✅ Xong."
