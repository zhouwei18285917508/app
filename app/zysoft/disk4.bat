set old=Y:
set new=M:
for /f %%i in ('mountvol %old% /l') do set "vol=%%i" 
mountvol %old% /d 
mountvol %new% %vol%
popd 

