!macro customInstall
  CreateShortCut "$APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Pixels Rich Presence.lnk" "$INSTDIR\Pixels Rich Presence.exe"
!macroend

!macro customUnInstall
  Delete "$APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Pixels Rich Presence.lnk"
!macroend
