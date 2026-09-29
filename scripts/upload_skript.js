import Client from 'ssh2-sftp-client'
import dotenv from 'dotenv'

dotenv.config()

const skriptContent = `# ========================================================
# VALDORA WEB SERVER AUTO-LAUNCHER & LIVE BRIDGE
# Otomatis menyalakan website di port 25054 saat MC boot
# & mengekspor status pemain online real-time ke web
# ========================================================

import:
    java.lang.ProcessBuilder
    java.lang.Process
    java.io.File
    java.nio.file.Files
    java.net.URL

function updateWebStatus():
    set {_online} to number of all players
    set {_list} to ""
    loop all players:
        set {_pName} to loop-player's name
        set {_pUuid} to loop-player's uuid
        if {_list} is not "":
            set {_list} to "%{_list}%, "
        set {_list} to "%{_list}%{""name"":""%{_pName}%"", ""uuid"":""%{_pUuid}%""}"
    set {_json} to "{""online"":true, ""playersOnline"":%{_online}%, ""playersMax"":100, ""playerList"":[%{_list}%], ""version"":""1.21.x"", ""motd"":""VALDORA [1.21.X]""}"
    set {_file} to new File("web/live_status.json")
    Files.write({_file}.toPath(), {_json}.getBytes())

on script load:
    if {valdora_web_proc} is set:
        {valdora_web_proc}.destroyForcibly()
        delete {valdora_web_proc}
        wait 1 second

    set {_webDir} to new File("web")
    set {_nodeBin} to new File("web/node")
    if {_nodeBin}.exists():
        {_nodeBin}.setExecutable(true, false)
        send "[ValdoraWeb] Menyalakan Web Server Valdora di 0.0.0.0:25054..." to console
        set {_logFile} to new File("web/server.log")
        set {_pb} to new ProcessBuilder({_nodeBin}.getAbsolutePath(), "index.mjs")
        {_pb}.directory({_webDir})
        {_pb}.redirectOutput({_logFile})
        {_pb}.redirectErrorStream(true)
        set {valdora_web_proc} to {_pb}.start()
        send "[ValdoraWeb] Web Server Valdora berhasil aktif di 0.0.0.0:25054!" to console
    else:
        send "[ValdoraWeb] File web/node tidak ditemukan!" to console
    
    updateWebStatus()

on script unload:
    if {valdora_web_proc} is set:
        {valdora_web_proc}.destroyForcibly()
        delete {valdora_web_proc}
        send "[ValdoraWeb] Web Server dimatikan." to console

on join:
    wait 15 ticks
    updateWebStatus()

on quit:
    wait 15 ticks
    updateWebStatus()

every 5 seconds:
    updateWebStatus()
    set {_trigger} to new File("web/restart.trigger")
    if {_trigger}.exists():
        {_trigger}.delete()
        if {valdora_web_proc} is set:
            {valdora_web_proc}.destroyForcibly()
            delete {valdora_web_proc}
            wait 1 second
        set {_webDir} to new File("web")
        set {_nodeBin} to new File("web/node")
        if {_nodeBin}.exists():
            set {_logFile} to new File("web/server.log")
            set {_pb} to new ProcessBuilder({_nodeBin}.getAbsolutePath(), "index.mjs")
            {_pb}.directory({_webDir})
            {_pb}.redirectOutput({_logFile})
            {_pb}.redirectErrorStream(true)
            set {valdora_web_proc} to {_pb}.start()
            send "[ValdoraWeb] Web Server otomatis di-reload via trigger file!" to console

command /valdoraweb <text>:
    permission: op
    trigger:
        if arg-1 is "restart":
            if {valdora_web_proc} is set:
                {valdora_web_proc}.destroyForcibly()
                delete {valdora_web_proc}
                wait 1 second
            set {_webDir} to new File("web")
            set {_nodeBin} to new File("web/node")
            if {_nodeBin}.exists():
                {_nodeBin}.setExecutable(true, false)
                set {_logFile} to new File("web/server.log")
                set {_pb} to new ProcessBuilder({_nodeBin}.getAbsolutePath(), "index.mjs")
                {_pb}.directory({_webDir})
                {_pb}.redirectOutput({_logFile})
                {_pb}.redirectErrorStream(true)
                set {valdora_web_proc} to {_pb}.start()
                send "[ValdoraWeb] Web Server direstart di 0.0.0.0:25054!" to sender
                updateWebStatus()
            else:
                send "[ValdoraWeb] File web/node belum tersedia!" to sender
        else if arg-1 is "stop":
            if {valdora_web_proc} is set:
                {valdora_web_proc}.destroyForcibly()
                delete {valdora_web_proc}
                send "[ValdoraWeb] Web Server dihentikan." to sender
            else:
                send "[ValdoraWeb] Web Server sedang tidak berjalan." to sender
        else if arg-1 is "start":
            set {_webDir} to new File("web")
            set {_nodeBin} to new File("web/node")
            if {_nodeBin}.exists():
                {_nodeBin}.setExecutable(true, false)
                set {_logFile} to new File("web/server.log")
                set {_pb} to new ProcessBuilder({_nodeBin}.getAbsolutePath(), "index.mjs")
                {_pb}.directory({_webDir})
                {_pb}.redirectOutput({_logFile})
                {_pb}.redirectErrorStream(true)
                set {valdora_web_proc} to {_pb}.start()
                send "[ValdoraWeb] Web Server dinyalakan di 0.0.0.0:25054!" to sender
                updateWebStatus()
            else:
                send "[ValdoraWeb] File web/node belum tersedia!" to sender
        else if arg-1 is "test":
            set {_url} to new URL("http://127.0.0.1:25054/")
            set {_conn} to {_url}.openConnection()
            set {_code} to {_conn}.getResponseCode()
            send "[ValdoraWeb Test] Koneksi lokal 127.0.0.1:25054 merespons: HTTP %{_code}%!" to sender
        else:
            send "Gunakan: /valdoraweb start | stop | restart | test" to sender
`

async function run() {
  const sftp = new Client()
  try {
    await sftp.connect({
      host: process.env.FTP_HOST,
      port: Number(process.env.FTP_PORT),
      username: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD
    })
    await sftp.put(Buffer.from(skriptContent), '/plugins/Skript/scripts/valdora_web.sk')
    console.log('✓ valdora_web.sk updated successfully on server!')
    await sftp.end()
  } catch (err) {
    console.error('Error:', err.message)
    try { await sftp.end() } catch {}
  }
}

run()
