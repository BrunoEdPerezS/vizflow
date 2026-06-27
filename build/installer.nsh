!include "StrFunc.nsh"
${StrRep}
${StrStr}
${UnStrRep}
${UnStrStr}

!macro customInstall
  ReadRegStr $0 HKCU "Environment" "Path"
  ; Remove any existing instance of INSTDIR first (dedup on reinstall)
  ${StrRep} $R0 ";$INSTDIR;" ";" "$0"
  ${StrRep} $R1 ";$INSTDIR" "" "$R0"
  ${StrRep} $R2 "$INSTDIR;" "" "$R1"
  ${if} $R2 == "$INSTDIR"
    StrCpy $R2 ""
  ${endif}
  ; Append INSTDIR to cleaned PATH
  ${If} $R2 == ""
    WriteRegExpandStr HKCU "Environment" "Path" "$INSTDIR"
  ${Else}
    WriteRegExpandStr HKCU "Environment" "Path" "$R2;$INSTDIR"
  ${EndIf}
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=500
!macroend

!macro customUninstall
  ReadRegStr $0 HKCU "Environment" "Path"
  ; Remove INSTDIR from PATH (handles all positions: beginning, middle, end, sole entry)
  ${UnStrRep} $R0 ";$INSTDIR;" ";" "$0"
  ${UnStrRep} $R1 ";$INSTDIR" "" "$R0"
  ${UnStrRep} $R2 "$INSTDIR;" "" "$R1"
  ${if} $R2 == "$INSTDIR"
    StrCpy $R2 ""
  ${endif}
  WriteRegExpandStr HKCU "Environment" "Path" "$R2"
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=500
!macroend
