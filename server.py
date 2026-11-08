#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Multi-Browser & Cross-Network Sync Server — giaoluucaulongcuoituan
Supports:
1. PC & Laptop Browsers (Opera GX, Chrome, Edge, Firefox, Safari, Cốc Cốc):
   - http://giaoluucaulongcuoituan.localhost:8686/noibo
   - http://giaoluucaulongcuoituan.localhost:8686/quantri
2. Mobile Phones & Tablets on Wi-Fi LAN (via sslip.io DNS resolution to LAN IP):
   - http://giaoluucaulongcuoituan.192-168-1-10.sslip.io:8686/noibo
   - http://giaoluucaulongcuoituan.192-168-1-10.sslip.io:8686/quantri
3. Mobile Phones & Tablets on External Networks (4G / 5G / Any Wi-Fi):
   - Zero-password HTTPS Tunnel (localhost.run) + Custom Short URLs (v.gd/is.gd)
   - Custom Subdomain HTTPS Tunnel (https://giaoluucaulong.loca.lt/giaoluucaulongcuoituan)
   - Real-time Cloud Sync Relay (https://ntfy.sh/giaoluucaulongcuoituan_db_v1)
"""

import json
import os
import re
import select
import socket
import subprocess
import threading
import time
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "club_data.json")
TUNNEL_FILE = os.path.join(BASE_DIR, "tunnel_info.json")
DATA_LOCK = threading.Lock()
PORT = 8686
CUSTOM_SUBDOMAIN = "giaoluucaulongcuoituan"
# localtunnel.me enforces a 20-char max limit on custom subdomains
LT_SUBDOMAIN = "giaoluucaulong"
CLOUD_DB_TOPIC = "https://ntfy.sh/giaoluucaulongcuoituan_db_v1"

TUNNEL_INFO = {
    "domainName": CUSTOM_SUBDOMAIN,
    "publicBaseUrl": "",
    "ltBaseUrl": f"https://{LT_SUBDOMAIN}.loca.lt",
    "lanIp": "192.168.1.10",
    "publicWanIp": "",
    "pcUserUrl": f"http://{CUSTOM_SUBDOMAIN}.localhost:{PORT}/noibo",
    "pcAdminUrl": f"http://{CUSTOM_SUBDOMAIN}.localhost:{PORT}/quantri",
    "lanUserUrl": f"http://{CUSTOM_SUBDOMAIN}.192-168-1-10.sslip.io:{PORT}/noibo",
    "lanAdminUrl": f"http://{CUSTOM_SUBDOMAIN}.192-168-1-10.sslip.io:{PORT}/quantri",
    "publicUserUrl": f"https://{LT_SUBDOMAIN}.loca.lt/{CUSTOM_SUBDOMAIN}",
    "publicAdminUrl": f"https://{LT_SUBDOMAIN}.loca.lt/quantri-{CUSTOM_SUBDOMAIN}",
    "directHttpsUserUrl": "",
    "directHttpsAdminUrl": "",
    "shortUserUrl": "",
    "shortAdminUrl": "",
}


def detect_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if ip and not ip.startswith("127."):
            return ip
    except Exception:
        pass
    return "192.168.1.10"


def detect_wan_ip():
    try:
        req = urllib.request.Request("https://api.ipify.org", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.read().decode("utf-8").strip()
    except Exception:
        return ""


def register_short_url(target_url, desired_slug):
    """Creates a clean v.gd or is.gd short URL pointing to the zero-password HTTPS tunnel."""
    for base_api in ["https://v.gd/create.php", "https://is.gd/create.php"]:
        try:
            params = urllib.parse.urlencode({
                "format": "simple",
                "url": target_url,
                "shorturl": desired_slug
            })
            req = urllib.request.Request(
                f"{base_api}?{params}",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                result = resp.read().decode("utf-8").strip()
                if result.startswith("https://"):
                    return result
        except Exception:
            pass
    return ""


def update_tunnel_info(lt_base=None, lhr_base=None):
    lan_ip = detect_lan_ip()
    dashed_ip = lan_ip.replace(".", "-")
    TUNNEL_INFO["lanIp"] = lan_ip
    if not TUNNEL_INFO.get("publicWanIp"):
        TUNNEL_INFO["publicWanIp"] = detect_wan_ip()
    TUNNEL_INFO["pcUserUrl"] = f"http://{CUSTOM_SUBDOMAIN}.localhost:{PORT}/noibo"
    TUNNEL_INFO["pcAdminUrl"] = f"http://{CUSTOM_SUBDOMAIN}.localhost:{PORT}/quantri"
    TUNNEL_INFO["lanUserUrl"] = f"http://{CUSTOM_SUBDOMAIN}.{dashed_ip}.sslip.io:{PORT}/noibo"
    TUNNEL_INFO["lanAdminUrl"] = f"http://{CUSTOM_SUBDOMAIN}.{dashed_ip}.sslip.io:{PORT}/quantri"

    if lt_base:
        lt_base = lt_base.rstrip("/")
        TUNNEL_INFO["ltBaseUrl"] = lt_base

    if lhr_base:
        lhr_base = lhr_base.rstrip("/")
        TUNNEL_INFO["publicBaseUrl"] = lhr_base
        TUNNEL_INFO["directHttpsUserUrl"] = f"{lhr_base}/{CUSTOM_SUBDOMAIN}"
        TUNNEL_INFO["directHttpsAdminUrl"] = f"{lhr_base}/quantri-{CUSTOM_SUBDOMAIN}"
        TUNNEL_INFO["publicUserUrl"] = TUNNEL_INFO["directHttpsUserUrl"]
        TUNNEL_INFO["publicAdminUrl"] = TUNNEL_INFO["directHttpsAdminUrl"]

    try:
        with open(TUNNEL_FILE, "w", encoding="utf-8") as f:
            json.dump(TUNNEL_INFO, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def push_state_to_cloud(state_obj):
    """Pushes latest state to ntfy.sh cloud relay so 4G/5G devices always stay synced."""
    try:
        compact = json.dumps(state_obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        req = urllib.request.Request(
            CLOUD_DB_TOPIC,
            data=compact,
            headers={"User-Agent": "Mozilla/5.0"},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=8).read()
    except Exception:
        pass


def cloud_sync_listener():
    """Polls ntfy.sh cloud relay so changes made on external networks sync back to club_data.json."""
    time.sleep(2)
    push_state_to_cloud(read_saved_state())
    while True:
        try:
            req = urllib.request.Request(
                f"{CLOUD_DB_TOPIC}/json?poll=1&since=30s",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw_lines = resp.read().decode("utf-8", errors="replace").strip().splitlines()
            for line in reversed(raw_lines):
                if not line.strip():
                    continue
                envelope = json.loads(line)
                if envelope.get("event") != "message":
                    continue
                msg_str = envelope.get("message") or ""
                if not msg_str.startswith("{"):
                    continue
                cloud_state = json.loads(msg_str)
                if isinstance(cloud_state, dict) and "members" in cloud_state and "costs" in cloud_state:
                    local_state = read_saved_state()
                    cloud_rev = int(cloud_state.get("_rev", 0))
                    local_rev = int(local_state.get("_rev", 0))
                    if cloud_rev > local_rev:
                        with DATA_LOCK:
                            temp_file = DATA_FILE + ".tmp"
                            with open(temp_file, "w", encoding="utf-8") as f:
                                json.dump(cloud_state, f, ensure_ascii=False, indent=2)
                            os.replace(temp_file, DATA_FILE)
                    break
        except Exception:
            pass
        time.sleep(4)


def pipe_sockets(remote_sock, local_sock):
    sockets = [remote_sock, local_sock]
    try:
        while True:
            rlist, _, xlist = select.select(sockets, [], sockets, 25)
            if xlist or not rlist:
                break
            for s in rlist:
                data = s.recv(65536)
                if not data:
                    return
                target = local_sock if s is remote_sock else remote_sock
                target.sendall(data)
    except Exception:
        pass
    finally:
        for s in sockets:
            try:
                s.close()
            except Exception:
                pass


def localtunnel_worker(remote_host, remote_port, stop_event):
    while not stop_event.is_set():
        remote_sock = None
        try:
            remote_sock = socket.create_connection((remote_host, remote_port), timeout=15)
            remote_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            rlist, _, _ = select.select([remote_sock], [], [], 50)
            if not rlist:
                remote_sock.close()
                continue
            first_chunk = remote_sock.recv(65536)
            if not first_chunk:
                remote_sock.close()
                continue
            local_sock = socket.create_connection(("127.0.0.1", PORT), timeout=10)
            local_sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            local_sock.sendall(first_chunk)
            pipe_sockets(remote_sock, local_sock)
        except Exception:
            if remote_sock:
                try:
                    remote_sock.close()
                except Exception:
                    pass
            time.sleep(0.5)


def start_custom_subdomain_tunnel():
    """Maintains https://giaoluucaulong.loca.lt/giaoluucaulongcuoituan across all networks."""
    while True:
        stop_event = threading.Event()
        try:
            req = urllib.request.Request(
                f"https://localtunnel.me/{LT_SUBDOMAIN}",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                info = json.loads(resp.read().decode("utf-8"))
            remote_port = int(info["port"])
            public_url = info.get("url", f"https://{LT_SUBDOMAIN}.loca.lt")
            update_tunnel_info(lt_base=public_url)

            workers = []
            for _ in range(4):
                t = threading.Thread(
                    target=localtunnel_worker,
                    args=("localtunnel.me", remote_port, stop_event),
                    daemon=True
                )
                t.start()
                workers.append(t)

            while any(w.is_alive() for w in workers):
                time.sleep(5)
        except Exception:
            pass
        finally:
            stop_event.set()
        time.sleep(3)


def start_public_https_tunnel():
    """Maintains a zero-password HTTPS tunnel via OpenSSH (localhost.run)."""
    ssh_cmd = [
        "ssh",
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "ServerAliveInterval=25",
        "-o", "ServerAliveCountMax=3",
        "-o", "ExitOnForwardFailure=yes",
        "-R", f"80:127.0.0.1:{PORT}",
        "nokey@localhost.run"
    ]
    url_pattern = re.compile(r"https://[a-zA-Z0-9.-]+\.lhr\.life")
    while True:
        try:
            proc = subprocess.Popen(
                ssh_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            for line in proc.stdout:
                matches = url_pattern.findall(line)
                if matches:
                    update_tunnel_info(lhr_base=matches[-1])
            proc.wait()
        except Exception:
            pass
        time.sleep(3)


DEFAULT_INITIAL_STATE = {
    "_rev": 1,
    "_updatedAt": int(time.time() * 1000),
    "settings": {
        "clubName": "Giao lưu cầu lông cuối tuần",
        "domainName": "giaoluucaulongcuoituan",
        "sessionDateISO": "2026-11-14",
        "sessionDate": "Thứ 7 · 14/11/2026",
        "sessionTime": "19:00 - 21:00",
        "courtLocation": "Sân Cầu Lông Phú Thọ (Sân 1, 2, 3)",
        "maxPlayers": 16
    },
    "members": [],
    "costs": {
        "courtsCount": 3,
        "courtHours": 2,
        "courtRate": 90000,
        "shuttleCount": 12,
        "shuttlePrice": 25000,
        "extraExpenses": [],
        "splitMode": "equal",
        "roundThousand": True
    },
    "matches": []
}


def ensure_initial_state():
    with DATA_LOCK:
        if not os.path.exists(DATA_FILE):
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_INITIAL_STATE, f, ensure_ascii=False, indent=2)
            return DEFAULT_INITIAL_STATE
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict) and "members" in data:
                    return data
        except Exception:
            pass
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_INITIAL_STATE, f, ensure_ascii=False, indent=2)
        return DEFAULT_INITIAL_STATE


def read_saved_state():
    return ensure_initial_state()


def write_saved_state(payload):
    with DATA_LOCK:
        current_rev = 1
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    old = json.load(f)
                    current_rev = int(old.get("_rev", 1))
            except Exception:
                pass
        payload["_rev"] = max(current_rev + 1, int(payload.get("_rev", 0)))
        payload["_updatedAt"] = int(time.time() * 1000)
        temp_file = DATA_FILE + ".tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.replace(temp_file, DATA_FILE)
    threading.Thread(target=push_state_to_cloud, args=(payload,), daemon=True).start()
    return payload


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


class IPv6ReusableThreadingHTTPServer(ReusableThreadingHTTPServer):
    address_family = socket.AF_INET6


class SyncHTTPRequestHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Cache-Control, Bypass-Tunnel-Reminder")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        host = (self.headers.get("Host") or "").lower()

        if parsed.path.endswith("/api/state") or parsed.path == "/api/state":
            state = read_saved_state()
            query = parsed.query or ""
            client_rev = None
            for part in query.split("&"):
                if part.startswith("rev="):
                    try:
                        client_rev = int(part.split("=", 1)[1])
                    except Exception:
                        pass
            if client_rev is not None and client_rev == state.get("_rev"):
                body = json.dumps({"ok": True, "unchanged": True, "_rev": state.get("_rev")}).encode("utf-8")
            else:
                body = json.dumps({"ok": True, "state": state}, ensure_ascii=False).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path.endswith("/api/links") or parsed.path == "/api/links":
            body = json.dumps(TUNNEL_INFO, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path.endswith("/styles.css"):
            self.path = "/styles.css"
        elif parsed.path.endswith("/app.js"):
            self.path = "/app.js"
        elif parsed.path.endswith("/club_data.json"):
            self.path = "/club_data.json"
        elif parsed.path in (
            "/admin",
            "/quantri",
            f"/quantri-{CUSTOM_SUBDOMAIN}",
            f"/{CUSTOM_SUBDOMAIN}/quantri",
        ):
            self.path = "/admin.html"
        elif parsed.path in (
            "/user",
            "/noibo",
            "/thanhvien",
            f"/{CUSTOM_SUBDOMAIN}",
            f"/{CUSTOM_SUBDOMAIN}/noibo",
        ):
            self.path = "/user.html"
        elif parsed.path == "/":
            if host.startswith("admin.") or host.startswith("quantri."):
                self.path = "/admin.html"
            else:
                self.path = "/user.html"

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path.endswith("/api/state") or parsed.path == "/api/state":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                raw_body = self.rfile.read(length).decode("utf-8")
                data = json.loads(raw_body)
                if isinstance(data, dict) and "members" in data and "costs" in data and "matches" in data:
                    saved = write_saved_state(data)
                    body = json.dumps(
                        {
                            "ok": True,
                            "_rev": saved.get("_rev"),
                            "_updatedAt": saved.get("_updatedAt"),
                        },
                        ensure_ascii=False,
                    ).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    return
            except Exception as e:
                body = json.dumps({"ok": False, "error": str(e)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return

        self.send_response(404)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    ensure_initial_state()
    update_tunnel_info()

    # Start IPv4 server on 0.0.0.0:8686 (PC + LAN Wi-Fi)
    ipv4_server = ReusableThreadingHTTPServer(("0.0.0.0", PORT), SyncHTTPRequestHandler)
    t4 = threading.Thread(target=ipv4_server.serve_forever, daemon=True)
    t4.start()

    # Start IPv6 server on [::]:8686 (IPv6 localhost + LAN)
    try:
        ipv6_server = IPv6ReusableThreadingHTTPServer(("::", PORT), SyncHTTPRequestHandler)
        t6 = threading.Thread(target=ipv6_server.serve_forever, daemon=True)
        t6.start()
    except Exception:
        try:
            ipv6_server = IPv6ReusableThreadingHTTPServer(("::1", PORT), SyncHTTPRequestHandler)
            t6 = threading.Thread(target=ipv6_server.serve_forever, daemon=True)
            t6.start()
        except Exception:
            pass

    # Start Cloud Relay Sync Thread (ntfy.sh)
    t_cloud = threading.Thread(target=cloud_sync_listener, daemon=True)
    t_cloud.start()

    # Start Custom Subdomain Tunnel (https://giaoluucaulong.loca.lt/giaoluucaulongcuoituan)
    t_custom = threading.Thread(target=start_custom_subdomain_tunnel, daemon=True)
    t_custom.start()

    # Start Zero-Password HTTPS Tunnel for Mobile Phones (localhost.run)
    t_tunnel = threading.Thread(target=start_public_https_tunnel, daemon=True)
    t_tunnel.start()

    print(f"Dual-stack + Cross-Network Sync Server active on port {PORT}", flush=True)
    while True:
        time.sleep(3600)
