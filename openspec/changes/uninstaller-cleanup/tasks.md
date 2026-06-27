## 1. Windows NSIS uninstaller (build/installer.nsh)

- [x] 1.1 Add `!macro customUninstall` that reads PATH from registry, uses `${StrReplace}` to remove `$INSTDIR` (all three positions: `;$INSTDIR`, `$INSTDIR;`, standalone `$INSTDIR`), writes updated PATH, and broadcasts `WM_WININICHANGE`
- [x] 1.2 Update `!macro customInstall` to remove any existing instances of `$INSTDIR` from PATH before appending (deduplication via `${StrRep}` remove-then-append)

## 2. Linux .deb cleanup (package.json + script)

- [x] 2.1 Create `build/after-remove.sh` script that checks `$1 = purge` and removes `~/.config/vizflow/` and `~/.cache/vizflow/` for the real user (`$SUDO_USER`)
- [x] 2.2 Add `"afterRemove": "build/after-remove.sh"` to the `deb` config in package.json
- [x] 2.3 Make script executable: `chmod +x build/after-remove.sh`

## 3. Verification

- [ ] 3.1 Build Windows installer and verify PATH entry is added on install and removed on uninstall
- [ ] 3.2 Build Windows installer and verify reinstalling does not duplicate PATH entry
- [ ] 3.3 Build Linux .deb and verify `sudo apt purge` removes `~/.config/vizflow/` and `~/.cache/vizflow/`
- [ ] 3.4 Build Linux .deb and verify `sudo apt remove` preserves `~/.config/vizflow/` and `~/.cache/vizflow/`
