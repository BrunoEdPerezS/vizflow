#!/bin/bash
# Vizflow post-removal script (runs as root via dpkg --purge)
# $1 = "remove" or "purge"
# Only clean user config on purge, per Debian policy

if [ "$1" = "purge" ]; then
  if [ -n "$SUDO_USER" ] && [ "$SUDO_USER" != "root" ]; then
    USER_HOME=$(eval echo "~$SUDO_USER")
  else
    USER_HOME="$HOME"
  fi

  rm -rf "$USER_HOME/.config/vizflow"
  rm -rf "$USER_HOME/.cache/vizflow"
fi
