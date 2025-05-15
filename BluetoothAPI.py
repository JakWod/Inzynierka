from flask import Flask, render_template, request, jsonify, redirect, url_for
import sys
import time
import threading
import traceback
import json
import platform
import os
import subprocess
import re
from PySide6.QtCore import QCoreApplication, QObject, QTimer, Signal, QEventLoop, QThread
from PySide6.QtBluetooth import (QBluetoothDeviceDiscoveryAgent,
                              QBluetoothSocket, QBluetoothServiceInfo, QBluetoothAddress, QBluetoothLocalDevice)

# Globalne zmienne do przechowywania stanu
discovered_devices = []
paired_devices = []
logs = []
bt_client = None
qt_app = None
connected_device_address = None

# Inicjalizacja aplikacji Flask
app = Flask(__name__)

def add_log(message, level="INFO"):
    """Dodaje wiadomość do logów z poziomem ważności"""
    log_entry = f"[{level}] {message}"
    logs.append(log_entry)
    print(log_entry)  # Wyświetl również w konsoli
    
    # Zachowaj tylko ostatnie 500 logów
    if len(logs) > 500:
        logs.pop(0)

def reset_bluetooth():
    """
    Funkcja resetująca adapter Bluetooth niezależnie od klasy klienta.
    Ta funkcja może być wywoływana bezpośrednio po rozłączeniu.
    """
    try:
        add_log("Uruchamianie procedury resetowania Bluetooth...", "INFO")
        
        # Poczekaj chwilę, aby upewnić się, że rozłączenie się zakończyło
        time.sleep(1)
        QCoreApplication.processEvents()
        
        # Spróbuj resetować Bluetooth przez Qt API
        local_device = QBluetoothLocalDevice()
        if local_device.isValid():
            current_mode = local_device.hostMode()
            add_log(f"Aktualny tryb Bluetooth: {current_mode}", "DEBUG")
            
            # Zapamiętaj oryginalny tryb
            original_mode = current_mode
            
            add_log("Wyłączam Bluetooth...", "INFO")
            local_device.setHostMode(QBluetoothLocalDevice.HostMode.HostPoweredOff)
            
            # Daj czas adaptera na wyłączenie
            for i in range(10):  # Timeout: 2 sekundy
                time.sleep(0.2)
                QCoreApplication.processEvents()
                # Sprawdź, czy wyłączenie się powiodło
                if local_device.hostMode() == QBluetoothLocalDevice.HostMode.HostPoweredOff:
                    add_log("Bluetooth został wyłączony pomyślnie", "INFO")
                    break
            
            # Teraz spróbuj włączyć Bluetooth
            add_log("Włączam Bluetooth w trybie Discoverable...", "INFO")
            local_device.setHostMode(QBluetoothLocalDevice.HostMode.HostDiscoverable)
            
            # Daj czas adaptera na włączenie
            for i in range(15):  # Timeout: 3 sekundy
                time.sleep(0.2)
                QCoreApplication.processEvents()
                current_mode = local_device.hostMode()
                # Sprawdź, czy włączenie się powiodło
                if current_mode != QBluetoothLocalDevice.HostMode.HostPoweredOff:
                    add_log(f"Bluetooth został włączony pomyślnie w trybie: {current_mode}", "INFO")
                    return True
            
            # Jeśli nie udało się włączyć w trybie Discoverable, spróbuj Connectable
            if local_device.hostMode() == QBluetoothLocalDevice.HostMode.HostPoweredOff:
                add_log("Próba włączenia w trybie Connectable...", "WARNING")
                local_device.setHostMode(QBluetoothLocalDevice.HostMode.HostConnectable)
                
                # Daj czas adaptera na włączenie
                for i in range(15):  # Timeout: 3 sekundy
                    time.sleep(0.2)
                    QCoreApplication.processEvents()
                    current_mode = local_device.hostMode()
                    # Sprawdź, czy włączenie się powiodło
                    if current_mode != QBluetoothLocalDevice.HostMode.HostPoweredOff:
                        add_log(f"Bluetooth został włączony pomyślnie w trybie: {current_mode}", "INFO")
                        return True
                
                # Jeśli nadal nie udało się włączyć, spróbuj przywrócić oryginalny tryb
                if local_device.hostMode() == QBluetoothLocalDevice.HostMode.HostPoweredOff:
                    add_log("Próba przywrócenia oryginalnego trybu...", "WARNING")
                    local_device.setHostMode(original_mode)
                    
                    time.sleep(1)
                    QCoreApplication.processEvents()
                    
                    if local_device.hostMode() == QBluetoothLocalDevice.HostMode.HostPoweredOff:
                        add_log("Nie udało się włączyć Bluetooth", "ERROR")
                        return False
            
            add_log(f"Bluetooth działa w trybie: {local_device.hostMode()}", "INFO")
            return True
        else:
            add_log("QBluetoothLocalDevice nie jest ważny", "ERROR")
            return False
            
    except Exception as e:
        add_log(f"Błąd podczas resetowania Bluetooth: {str(e)}", "ERROR")
        add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
        return False

class BluetoothConsoleClient(QObject):
    """Klasa obsługująca komunikację Bluetooth w aplikacji Flask"""
    
    # Sygnały
    connected = Signal()
    disconnected = Signal()
    message_received = Signal(bytes)
    error_occurred = Signal(str)
    
    def __init__(self):
        super().__init__()
        
        # Socket do komunikacji
        self._create_socket()
        
        # Flagi stanu
        self.is_connected = False
        self.connection_error = False
        self.last_error = ""
        self.connected_device_address = None
    
    def _create_socket(self):
        """Tworzy nowy socket Bluetooth"""
        try:
            # Jeśli już mamy socket, zamknij go
            if hasattr(self, 'socket') and self.socket:
                try:
                    self.socket.disconnectFromService()
                    self.socket.close()
                except Exception as e:
                    add_log(f"Błąd podczas zamykania starego socketu: {str(e)}", "ERROR")
                
            # Utwórz nowy socket
            self.socket = QBluetoothSocket(QBluetoothServiceInfo.Protocol.RfcommProtocol)
            
            # Połącz sygnały
            self.socket.connected.connect(self._on_connected)
            self.socket.disconnected.connect(self._on_disconnected)
            self.socket.readyRead.connect(self._on_ready_read)
            self.socket.errorOccurred.connect(self._on_socket_error)
            
            add_log("Utworzono nowy socket Bluetooth", "DEBUG")
        except Exception as e:
            add_log(f"Błąd podczas tworzenia socketu: {str(e)}", "ERROR")
            add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
    
    def connect_to_device(self, address_str, port=1):
        """Łączy się z urządzeniem o podanym adresie MAC"""
        try:
            # Jeśli mamy aktywne połączenie, najpierw rozłącz
            if self.is_connected:
                add_log("Rozłączanie aktywnego połączenia przed nowym połączeniem", "INFO")
                self.disconnect()
                
            # Upewnij się, że socket jest w stanie niepołączonym
            if self.socket.state() != QBluetoothSocket.SocketState.UnconnectedState:
                add_log("Socket nie jest w stanie rozłączonym, tworzę nowy", "WARNING")
                self._create_socket()
                
            add_log(f"Próba połączenia z urządzeniem {address_str}...", "INFO")
            
            try:
                address = QBluetoothAddress(address_str)
                add_log(f"Utworzono obiekt adresu: {address.toString()}", "DEBUG")
            except Exception as e:
                add_log(f"Błąd podczas parsowania adresu MAC: {str(e)}", "ERROR")
                return False
            
            # Zresetuj flagi
            self.is_connected = False
            self.connection_error = False
            self.last_error = ""
            
            # Połącz
            try:
                self.socket.connectToService(address, port)
                add_log(f"Wywołano connectToService z adresem {address.toString()} i portem {port}", "DEBUG")
            except Exception as e:
                add_log(f"Błąd podczas wywołania connectToService: {str(e)}", "ERROR")
                return False
            
            # Poczekaj na połączenie lub timeout
            loop = QEventLoop()
            
            # Timer na timeout połączenia
            timer = QTimer()
            timer.setSingleShot(True)
            timer.timeout.connect(lambda: self._connection_timeout(loop))
            timer.start(10000)  # 10 sekund na połączenie
            
            # Tymczasowe funkcje dla połączeń sygnałów
            def on_temp_connected():
                add_log("Sygnał connected otrzymany", "DEBUG")
                self._stop_connection_wait(loop, timer)
                
            def on_temp_error(err):
                add_log(f"Sygnał błędu otrzymany: {err}", "DEBUG")
                self._connection_error(loop, timer, err)
            
            # Gdy połączenie zostanie ustanowione, zatrzymaj pętlę
            self.connected.connect(on_temp_connected)
            
            # Gdy wystąpi błąd, zatrzymaj pętlę
            self.error_occurred.connect(on_temp_error)
            
            add_log("Oczekiwanie na połączenie lub timeout...", "DEBUG")
            
            # Uruchom pętlę i czekaj
            loop.exec()
            
            # Odłącz tymczasowe połączenia sygnałów
            self.connected.disconnect(on_temp_connected)
            self.error_occurred.disconnect(on_temp_error)
            
            # Zwróć status połączenia
            if self.is_connected:
                add_log(f"Połączono z urządzeniem {address_str} pomyślnie", "INFO")
                self.connected_device_address = address_str
                global connected_device_address
                connected_device_address = address_str
                return True
            else:
                if self.last_error:
                    add_log(f"Błąd połączenia: {self.last_error}", "ERROR")
                else:
                    add_log("Timeout połączenia", "WARNING")
                return False
                
        except Exception as e:
            add_log(f"Nieoczekiwany wyjątek podczas łączenia: {str(e)}", "ERROR")
            add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
            return False
    
    def unpair_device(self, address_str):
        """Rozparowuje urządzenie w systemie Windows używając BluetoothAPI poprzez ctypes"""
        try:
            import ctypes
            from ctypes import windll, byref, Structure, WinError, POINTER, c_ubyte
            from ctypes.wintypes import BOOL, DWORD, HANDLE
            
            add_log("Używam Windows BluetoothAPI przez ctypes...", "INFO")
            
            # Konwersja adresu MAC do formatu potrzebnego dla API
            try:
                addr_bytes = bytes.fromhex(address_str.replace(":", ""))
                addr_reversed = bytes(reversed(addr_bytes))  # Bluetooth API używa odwrotnej kolejności
                add_log(f"Przygotowany adres w formie bajtów: {addr_bytes.hex()}", "DEBUG")
            except Exception as e:
                add_log(f"Błąd podczas konwersji adresu MAC: {str(e)}", "ERROR")
                return False
            
            # Definicje struktur i stałych
            class BLUETOOTH_ADDRESS(Structure):
                _fields_ = [("addr", c_ubyte * 6)]
            
            # Ładowanie biblioteki i definicja funkcji
            try:
                bthprops = windll.LoadLibrary("bthprops.cpl")
                BluetoothRemoveDevice = bthprops.BluetoothRemoveDevice
                BluetoothRemoveDevice.argtypes = [POINTER(BLUETOOTH_ADDRESS)]
                BluetoothRemoveDevice.restype = DWORD
                add_log("Biblioteka bthprops.cpl załadowana pomyślnie", "DEBUG")
            except Exception as e:
                add_log(f"Błąd podczas ładowania biblioteki bthprops.cpl: {str(e)}", "ERROR")
                return False
            
            # Przygotowanie struktury adresu
            bt_addr = BLUETOOTH_ADDRESS()
            
            # Wypełnienie adresu MAC
            for i, b in enumerate(addr_reversed):
                bt_addr.addr[i] = b
            
            # Wywołanie API do rozparowania
            try:
                result = BluetoothRemoveDevice(byref(bt_addr))
                add_log(f"BluetoothRemoveDevice zwrócił kod: {result}", "DEBUG")
            except Exception as e:
                add_log(f"Błąd podczas wywołania BluetoothRemoveDevice: {str(e)}", "ERROR")
                return False
            
            if result == 0:  # ERROR_SUCCESS
                add_log("Rozparowanie zakończone sukcesem", "INFO")
                return True
            else:
                try:
                    error_message = WinError(result).strerror
                    add_log(f"Błąd rozparowania: {error_message} (kod {result})", "ERROR")
                except Exception as e:
                    add_log(f"Nie można uzyskać komunikatu błędu: {str(e)}", "ERROR")
                return False
        
        except Exception as e:
            add_log(f"Nieoczekiwany wyjątek podczas rozparowania: {str(e)}", "ERROR")
            add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
            return False

    def disconnect(self):
        """
        Zmodyfikowana metoda disconnect, która po rozłączeniu wywołuje niezależną funkcję
        resetującą Bluetooth.
        """
        if not hasattr(self, 'socket') or not self.socket:
            add_log("Brak inicjalizowanego socketu", "WARNING")
            self.is_connected = False
            return False
                
        if self.socket.state() == QBluetoothSocket.SocketState.ConnectedState:
            add_log("Rozłączanie...", "INFO")
            
            try:
                self.socket.disconnectFromService()
                add_log("Wywołano disconnectFromService", "DEBUG")
            except Exception as e:
                add_log(f"Błąd podczas disconnectFromService: {str(e)}", "ERROR")
            
            # Poczekaj na rozłączenie
            timeout = 0
            add_log("Oczekiwanie na rozłączenie...", "DEBUG")
            while (self.socket.state() != QBluetoothSocket.SocketState.UnconnectedState and 
                    timeout < 30):
                QCoreApplication.processEvents()
                time.sleep(0.1)
                timeout += 1
                    
            self.is_connected = False
            self.connected_device_address = None
            global connected_device_address
            connected_device_address = None

            # Zamiast próbować resetować Bluetooth w metodzie, wywołaj dedykowaną funkcję
            reset_success = reset_bluetooth()
            if not reset_success:
                add_log("Resetowanie Bluetooth nie powiodło się - sprawdź logi", "WARNING")
            
            # Jeśli socket nadal nie jest rozłączony, utwórz nowy
            if self.socket.state() != QBluetoothSocket.SocketState.UnconnectedState:
                add_log("Rozłączenie nie powiodło się, tworzę nowy socket...", "WARNING")
                self._create_socket()
                
            return True
        else:
            add_log(f"Socket nie jest w stanie połączonym (aktualny stan: {self.socket.state()})", "WARNING")
        return False
    
    def send_data(self, data):
        """Wysyła dane do urządzenia"""
        if not self.is_connected:
            add_log("Nie można wysłać danych - brak połączenia", "WARNING")
            return False
        
        try:
            if isinstance(data, str):
                # Jeśli to string, zakładamy że to hex
                if data.startswith("0x"):
                    data = data[2:]
                
                add_log(f"Konwersja danych HEX: {data}", "DEBUG")
                data = bytes.fromhex(data)
            
            if not isinstance(data, (bytes, bytearray)):
                add_log("Nieprawidłowy typ danych - wymagane bytes lub hex string", "ERROR")
                return False
            
            add_log(f"Wysyłanie {len(data)} bajtów: 0x{data.hex().upper()}", "DEBUG")
            bytes_written = self.socket.write(data)
            add_log(f"Wysłano {bytes_written} bajtów: 0x{data.hex().upper()}", "INFO")
            return bytes_written > 0
        except Exception as e:
            add_log(f"Błąd podczas wysyłania danych: {str(e)}", "ERROR")
            add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
            return False
    
    def _on_connected(self):
        """Handler połączenia"""
        add_log("Połączono z urządzeniem!", "INFO")
        self.is_connected = True
        self.connected.emit()
    
    def _on_disconnected(self):
        """Handler rozłączenia"""
        add_log("Rozłączono z urządzeniem", "INFO")
        self.is_connected = False
        self.connected_device_address = None
        global connected_device_address
        connected_device_address = None
        self.disconnected.emit()
    
    def _on_ready_read(self):
        """Handler odebrania danych"""
        try:
            data = self.socket.readAll().data()
            hex_data = data.hex().upper()
            add_log(f"Odebrano dane: 0x{hex_data} ({len(data)} bajtów)", "INFO")
            
            # Próba dekodowania ASCII
            try:
                ascii_data = data.decode('ascii')
                if any(32 <= ord(c) <= 126 for c in ascii_data):
                    printable = ''.join(c if 32 <= ord(c) <= 126 else '.' for c in ascii_data)
                    add_log(f"ASCII: {printable}", "INFO")
            except UnicodeDecodeError:
                pass
                
            self.message_received.emit(data)
        except Exception as e:
            add_log(f"Błąd podczas odczytu danych: {str(e)}", "ERROR")
    
    def _on_socket_error(self, error):
        """Handler błędu socket'u"""
        error_messages = {
            QBluetoothSocket.SocketError.NoSocketError: "Brak błędu",
            QBluetoothSocket.SocketError.HostNotFoundError: "Nie znaleziono hosta",
            QBluetoothSocket.SocketError.ServiceNotFoundError: "Nie znaleziono usługi",
            QBluetoothSocket.SocketError.NetworkError: "Błąd sieci",
            QBluetoothSocket.SocketError.UnsupportedProtocolError: "Nieobsługiwany protokół",
            QBluetoothSocket.SocketError.OperationError: "Błąd operacji",
            QBluetoothSocket.SocketError.RemoteHostClosedError: "Zdalny host zamknął połączenie",
            QBluetoothSocket.SocketError.MissingPermissionsError: "Brak uprawnień",
            QBluetoothSocket.SocketError.UnknownSocketError: "Nieznany błąd"
        }
        
        error_message = error_messages.get(error, f"Nieznany błąd ({error})")
        self.last_error = error_message
        self.connection_error = True
        add_log(f"Błąd socket'u: {error_message}", "ERROR")
        self.error_occurred.emit(error_message)
    
    def _connection_timeout(self, loop):
        """Handler timeoutu połączenia"""
        if not self.is_connected and not self.connection_error:
            add_log("Timeout połączenia", "WARNING")
            loop.quit()
    
    def _stop_connection_wait(self, loop, timer):
        """Zatrzymuje oczekiwanie na połączenie po sukcesie"""
        timer.stop()
        loop.quit()
    
    def _connection_error(self, loop, timer, error):
        """Zatrzymuje oczekiwanie na połączenie po błędzie"""
        timer.stop()
        loop.quit()

def scan_devices():
    """Funkcja do skanowania dostępnych urządzeń Bluetooth"""
    global discovered_devices
    add_log("Rozpoczynam skanowanie urządzeń Bluetooth...", "INFO")
    
    discovered_devices = []
    discovery_complete = False
    
    try:
        discovery_agent = QBluetoothDeviceDiscoveryAgent()
        
        # Handlery zdarzeń
        def on_device_discovered(device_info):
            try:
                device_data = {
                    'name': device_info.name() or "Nieznane urządzenie",
                    'address': device_info.address().toString()
                }
                discovered_devices.append(device_data)
                add_log(f"Znaleziono: {device_data['name']} - {device_data['address']}", "INFO")
            except Exception as e:
                add_log(f"Błąd podczas przetwarzania znalezionego urządzenia: {str(e)}", "ERROR")
        
        def on_finished():
            nonlocal discovery_complete
            discovery_complete = True
            add_log(f"Skanowanie zakończone. Znaleziono {len(discovered_devices)} urządzeń.", "INFO")
        
        def on_error(error):
            nonlocal discovery_complete
            discovery_complete = True
            error_msgs = {
                QBluetoothDeviceDiscoveryAgent.Error.NoError: "Brak błędu",
                QBluetoothDeviceDiscoveryAgent.Error.PoweredOffError: "Bluetooth wyłączony",
                QBluetoothDeviceDiscoveryAgent.Error.InputOutputError: "Błąd wejścia/wyjścia",
                QBluetoothDeviceDiscoveryAgent.Error.InvalidBluetoothAdapterError: "Nieprawidłowy adapter Bluetooth",
                QBluetoothDeviceDiscoveryAgent.Error.UnsupportedPlatformError: "Niewspierana platforma",
                QBluetoothDeviceDiscoveryAgent.Error.UnsupportedDiscoveryMethod: "Niewspierana metoda wykrywania",
                QBluetoothDeviceDiscoveryAgent.Error.LocationServiceTurnedOffError: "Usługa lokalizacji wyłączona",
                QBluetoothDeviceDiscoveryAgent.Error.MissingPermissionsError: "Brak uprawnień",
                QBluetoothDeviceDiscoveryAgent.Error.UnknownError: "Nieznany błąd"
            }
            error_msg = error_msgs.get(error, f"Nieznany błąd ({error})")
            add_log(f"Błąd podczas skanowania: {error_msg}", "ERROR")
        
        # Sygnały
        discovery_agent.deviceDiscovered.connect(on_device_discovered)
        discovery_agent.finished.connect(on_finished)
        discovery_agent.errorOccurred.connect(on_error)
        
        # Skanowanie
        discovery_agent.start()
        add_log("Rozpoczęto skanowanie urządzeń Bluetooth", "DEBUG")
        
        # Zakończenie skanowania
        loop = QEventLoop()
        
        # Timer do timeoutu skanowania
        timer = QTimer()
        timer.setSingleShot(True)
        timer.timeout.connect(loop.quit)
        timer.start(20000)  # 20 sekund na skanowanie
        
        # Gdy skanowanie się zakończy, zatrzymaj pętlę
        discovery_agent.finished.connect(loop.quit)
        discovery_agent.errorOccurred.connect(loop.quit)
        
        # Uruchom pętlę i czekaj
        add_log("Oczekiwanie na zakończenie skanowania...", "DEBUG")
        loop.exec()
        
        # Jeśli skanowanie nadal trwa, zatrzymaj je
        if not discovery_complete:
            add_log("Timeout skanowania, zatrzymuję...", "WARNING")
            discovery_agent.stop()
        
    except Exception as e:
        add_log(f"Nieoczekiwany błąd podczas skanowania: {str(e)}", "ERROR")
        add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
    
    return discovered_devices


def get_system_paired_devices():
    """Pobiera sparowane urządzenia bezpośrednio z systemu operacyjnego"""
    system_devices = []
    try:
        # Sprawdź system operacyjny
        system = platform.system()
        
        if system == "Windows":
            add_log("Pobieranie sparowanych urządzeń z systemu Windows", "INFO")
            # Użyj komendy PowerShell do pobrania sparowanych urządzeń Bluetooth
            try:
                command = "powershell -command \"& {Get-PnpDevice -Class Bluetooth | Where-Object { $_.FriendlyName -notlike '*Radio*' } | Select-Object FriendlyName, DeviceID, Status | ConvertTo-Json}\""
                result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
                
                if result.returncode == 0 and result.stdout and result.stdout.strip():
                    try:
                        # Konwersja wyjścia do JSON
                        devices_raw = json.loads(result.stdout)
                        
                        # PowerShell może zwrócić pojedynczy obiekt zamiast tablicy, jeśli jest tylko jedno urządzenie
                        if not isinstance(devices_raw, list):
                            devices_raw = [devices_raw]
                        
                        for device in devices_raw:
                            # Wyciągnij adres MAC z DeviceID (ostatnie 17 znaków przed _C00000000)
                            mac_address = None
                            
                            if 'DeviceID' in device and device['DeviceID']:
                                match = re.search(r'([0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2})', 
                                                  device['DeviceID'], re.IGNORECASE)
                                
                                if match:
                                    mac_address = match.group(1)
                            
                            if mac_address and 'FriendlyName' in device:
                                device_info = {
                                    'name': device['FriendlyName'],
                                    'address': mac_address,
                                    'status': device.get('Status', 'Unknown'),
                                    'connected': False  # Domyślnie ustawiane na False
                                }
                                
                                # Sprawdź czy urządzenie jest już podłączone
                                if bt_client and bt_client.is_connected and bt_client.connected_device_address == mac_address:
                                    device_info['connected'] = True
                                
                                system_devices.append(device_info)
                    except Exception as e:
                        add_log(f"Błąd podczas parsowania danych z PowerShell: {str(e)}", "ERROR")
                else:
                    # Alternatywna metoda uzyskania urządzeń Bluetooth
                    add_log("Alternatywne pobieranie sparowanych urządzeń Bluetooth w Windows", "INFO")
                    # Sprawdź podłączone urządzenie Bluetooth
                    if bt_client and bt_client.is_connected and bt_client.connected_device_address:
                        # Dodaj chociaż podłączone urządzenie
                        device_info = {
                            'name': 'Połączone urządzenie Bluetooth',
                            'address': bt_client.connected_device_address,
                            'status': 'Connected',
                            'connected': True
                        }
                        system_devices.append(device_info)
            except Exception as e:
                add_log(f"Błąd podczas pobierania urządzeń przez PowerShell: {str(e)}", "ERROR")
                add_log(f"Szczegóły błędu: {traceback.format_exc()}", "DEBUG")
                # Próba alternatywnej metody
                if bt_client and bt_client.is_connected and bt_client.connected_device_address:
                    # Dodaj chociaż podłączone urządzenie
                    device_info = {
                        'name': 'Połączone urządzenie Bluetooth',
                        'address': bt_client.connected_device_address,
                        'status': 'Connected',
                        'connected': True
                    }
                    system_devices.append(device_info)
            
        elif system == "Linux":
            # Implementacja dla Linuxa
            add_log("Pobieranie sparowanych urządzeń z systemu Linux", "INFO")
            command = "bluetoothctl paired-devices"
            result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
            
            if result.returncode == 0 and result.stdout:
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if line.strip():
                        # Format: Device XX:XX:XX:XX:XX:XX DeviceName
                        parts = line.strip().split(' ', 2)
                        if len(parts) >= 3 and parts[0] == "Device":
                            mac_address = parts[1]
                            device_name = parts[2] if len(parts) > 2 else "Nieznane urządzenie"
                            
                            device_info = {
                                'name': device_name,
                                'address': mac_address,
                                'status': 'Unknown',
                                'connected': False
                            }
                            
                            # Sprawdź czy urządzenie jest już podłączone
                            if bt_client and bt_client.is_connected and bt_client.connected_device_address == mac_address:
                                device_info['connected'] = True
                                
                            system_devices.append(device_info)
            else:
                add_log(f"Błąd wykonania bluetoothctl: {result.stderr}", "ERROR")
                
        elif system == "Darwin":  # macOS
            # Implementacja dla macOS
            add_log("Pobieranie sparowanych urządzeń z systemu macOS", "INFO")
            command = "system_profiler SPBluetoothDataType -json"
            result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
            
            if result.returncode == 0 and result.stdout:
                try:
                    data = json.loads(result.stdout)
                    bluetooth_data = data.get('SPBluetoothDataType', [{}])[0]
                    devices_data = bluetooth_data.get('device_title', {})
                    
                    for device_name, device_info in devices_data.items():
                        if 'device_address' in device_info:
                            mac_address = device_info['device_address']
                            
                            device_data = {
                                'name': device_name,
                                'address': mac_address,
                                'status': 'Connected' if device_info.get('device_isconnected', False) else 'Not Connected',
                                'connected': device_info.get('device_isconnected', False)
                            }
                            
                            system_devices.append(device_data)
                except Exception as e:
                    add_log(f"Błąd podczas parsowania danych JSON z system_profiler: {str(e)}", "ERROR")
            else:
                add_log(f"Błąd wykonania system_profiler: {result.stderr}", "ERROR")
        
        else:
            add_log(f"Niewspierany system operacyjny: {system}", "ERROR")
        
        # Dodatkowe zabezpieczenie - jeśli lista jest pusta, ale mamy podłączone urządzenie
        if not system_devices and bt_client and bt_client.is_connected and bt_client.connected_device_address:
            # Dodaj chociaż podłączone urządzenie
            device_info = {
                'name': 'Połączone urządzenie Bluetooth',
                'address': bt_client.connected_device_address,
                'status': 'Connected',
                'connected': True
            }
            system_devices.append(device_info)
        
        add_log(f"Znaleziono {len(system_devices)} sparowanych urządzeń z systemu", "INFO")
        
    except Exception as e:
        add_log(f"Nieoczekiwany błąd podczas pobierania sparowanych urządzeń: {str(e)}", "ERROR")
        add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
        
        # Dodatkowe zabezpieczenie - jeśli wystąpił błąd, ale mamy podłączone urządzenie
        if bt_client and bt_client.is_connected and bt_client.connected_device_address:
            # Dodaj chociaż podłączone urządzenie
            device_info = {
                'name': 'Połączone urządzenie Bluetooth',
                'address': bt_client.connected_device_address,
                'status': 'Connected',
                'connected': True
            }
            system_devices.append(device_info)
    
    return system_devices

class QtThread(QThread):
    """Klasa do obsługi wątku Qt"""
    def run(self):
        """Główna pętla wątku Qt"""
        add_log("Uruchomiono wątek Qt", "INFO")
        # Ten wątek nie posiada własnej pętli zdarzeń Qt, korzystamy z głównej pętli
        while True:
            try:
                QCoreApplication.processEvents()
                time.sleep(0.01)  # Małe opóźnienie, aby nie obciążać CPU
            except Exception as e:
                add_log(f"Błąd w pętli zdarzeń Qt: {str(e)}", "ERROR")
                time.sleep(1)  # Większe opóźnienie w przypadku błędu


# Inicjalizacja klienta Bluetooth
def init_bluetooth():
    """Inicjalizuje klienta Bluetooth"""
    global bt_client
    
    try:
        # Sprawdź, czy Bluetooth jest dostępny
        local_device = QBluetoothLocalDevice()
        if not local_device.isValid():
            add_log("Bluetooth nie jest dostępny na tym urządzeniu", "ERROR")
            return False
            
        # Sprawdź, czy Bluetooth jest włączony
        if local_device.hostMode() == QBluetoothLocalDevice.HostMode.HostPoweredOff:
            add_log("Bluetooth jest wyłączony. Proszę włączyć Bluetooth i spróbować ponownie.", "ERROR")
            return False
        
        add_log(f"Lokalne urządzenie Bluetooth: {local_device.name()} ({local_device.address().toString()})", "INFO")
        
        # Utwórz klienta Bluetooth
        bt_client = BluetoothConsoleClient()
        add_log("Klient Bluetooth zainicjalizowany pomyślnie", "INFO")
        return True
    except Exception as e:
        add_log(f"Błąd podczas inicjalizacji Bluetooth: {str(e)}", "ERROR")
        add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
        return False


# Trasy Flask
@app.route('/')
def index():
    """Strona główna aplikacji"""
    # Sprawdź status Bluetooth przy każdym odświeżeniu strony
    bluetooth_status = "Dostępny" if bt_client and bt_client.is_connected else "Niepołączony"
    add_log(f"Odświeżono stronę główną, status Bluetooth: {bluetooth_status}", "DEBUG")
    return render_template('main.html', 
                          logs=logs, 
                          devices=discovered_devices, 
                          bluetooth_status=bluetooth_status)


@app.route('/scan', methods=['POST'])
def scan():
    """Trasa do skanowania urządzeń"""
    add_log("Otrzymano żądanie skanowania urządzeń", "DEBUG")
    scan_devices()
    return redirect(url_for('index'))


@app.route('/connect', methods=['POST'])
def connect():
    """Trasa do łączenia z urządzeniem"""
    address = request.form.get('address')
    add_log(f"Otrzymano żądanie połączenia z adresem: {address}", "DEBUG")
    
    connection_success = False
    device_info = {
        'name': 'Nieznane urządzenie',
        'address': address,
        'connected': False,
        'type': 'other'
    }
    
    if address:
        if bt_client:
            # Próba połączenia
            connection_success = bt_client.connect_to_device(address)
            
            # Jeśli połączenie się powiodło, dodaj urządzenie do lokalnej bazy
            if connection_success:
                # Ustaw status połączenia
                device_info['connected'] = True
                
                # Próba pobrania nazwy urządzenia z systemu
                try:
                    system_devices = get_system_paired_devices()
                    matching_device = next((dev for dev in system_devices if dev['address'] == address), None)
                    
                    if matching_device:
                        device_info['name'] = matching_device.get('name', 'Nieznane urządzenie')
                        # Można też pobrać inne dostępne informacje
                except Exception as e:
                    add_log(f"Błąd podczas pobierania informacji o urządzeniu: {str(e)}", "ERROR")
                
                # Dodaj skrypt do strony, który doda urządzenie do localStorage po załadowaniu
                connect_script = f"""
                <script>
                    document.addEventListener('DOMContentLoaded', function() {{
                        // Wyślij zdarzenie deviceConnected
                        window.dispatchEvent(new CustomEvent('deviceConnected', {{
                            detail: {{
                                device: {{
                                    name: "{device_info['name']}",
                                    address: "{device_info['address']}",
                                    connected: true,
                                    type: "{device_info['type']}"
                                }}
                            }}
                        }}));
                    }});
                </script>
                """
                # Przekieruj na stronę główną z dodatkowym skryptem
                return render_template('main.html', 
                              logs=logs, 
                              devices=discovered_devices, 
                              bluetooth_status="Dostępny" if bt_client.is_connected else "Niepołączony",
                              connect_script=connect_script)
        else:
            add_log("Bluetooth nie został zainicjalizowany", "ERROR")
    else:
        add_log("Nie podano adresu MAC", "WARNING")
    
    # Jeśli doszliśmy tutaj, przekieruj na stronę główną bez skryptu
    return redirect(url_for('index'))


@app.route('/disconnect', methods=['POST'])
def disconnect():
    """Trasa do rozłączania urządzenia"""
    add_log("Otrzymano żądanie rozłączenia", "DEBUG")
    disconnect_success = False
    
    if bt_client and bt_client.is_connected:
        disconnect_success = bt_client.disconnect()
    else:
        add_log("Brak aktywnego połączenia", "WARNING")
    
    # Dodatkowe bezpośrednie wywołanie resetowania Bluetooth
    if disconnect_success:
        add_log("Próba dodatkowego resetowania Bluetooth po rozłączeniu", "INFO")
        # Dokonujemy dodatkowego resetowania jako zabezpieczenie
        reset_bluetooth()
    
    return redirect(url_for('index'))


@app.route('/unpair', methods=['POST'])
def unpair():
    """Trasa do rozparowywania urządzenia"""
    address = request.form.get('address')
    add_log(f"Otrzymano żądanie rozparowania urządzenia o adresie: {address}", "DEBUG")
    if address:
        if bt_client:
            bt_client.unpair_device(address)
        else:
            add_log("Bluetooth nie został zainicjalizowany", "ERROR")
    else:
        add_log("Nie podano adresu MAC", "WARNING")
    return redirect(url_for('index'))


@app.route('/send', methods=['POST'])
def send():
    """Trasa do wysyłania danych"""
    data = request.form.get('data')
    add_log(f"Otrzymano żądanie wysłania danych: {data}", "DEBUG")
    if data:
        if bt_client and bt_client.is_connected:
            bt_client.send_data(data)
        else:
            add_log("Brak aktywnego połączenia", "WARNING")
    else:
        add_log("Nie podano danych do wysłania", "WARNING")
    return redirect(url_for('index'))


@app.route('/status', methods=['POST'])
def status():
    """Trasa do sprawdzania statusu połączenia"""
    add_log("Otrzymano żądanie sprawdzenia statusu", "DEBUG")
    if bt_client:
        status_text = "Połączony" if bt_client.is_connected else "Niepołączony"
        add_log(f"Status: {status_text}", "INFO")
    else:
        add_log("Bluetooth nie został zainicjalizowany", "ERROR")
    return redirect(url_for('index'))


@app.route('/clear_logs', methods=['POST'])
def clear_logs():
    """Trasa do czyszczenia logów"""
    global logs
    add_log("Otrzymano żądanie wyczyszczenia logów", "DEBUG")
    logs = []
    add_log("Logi wyczyszczone", "INFO")
    return redirect(url_for('index'))

# New route to add to the Flask application
@app.route('/simulate_connection', methods=['POST'])
def simulate_connection():
    """Trasa do symulacji połączenia (tylko do testów)"""
    add_log("Otrzymano żądanie symulacji połączenia", "DEBUG")
    
    # Symulujemy połączenie
    global bt_client
    
    if bt_client:
        # Tylko symulujemy połączenie - ustawiamy flagę bez faktycznego łączenia
        bt_client.is_connected = True
        
        # Emitujemy sygnał połączenia
        bt_client.connected.emit()
        
        add_log("Zasymulowano połączenie z urządzeniem", "INFO")
    else:
        add_log("Bluetooth nie został zainicjalizowany", "ERROR")
    
    return redirect(url_for('index'))

# Nowa trasa do pobierania sparowanych urządzeń
@app.route('/get_paired_devices')
def get_paired_devices():
    """Trasa do pobierania listy sparowanych urządzeń"""
    add_log("Otrzymano żądanie pobrania sparowanych urządzeń", "DEBUG")
    try:
        # Pobierz urządzenia z systemu
        system_devices = get_system_paired_devices()
        
        # Dodaj informacje o aktualnie podłączonym urządzeniu
        if bt_client and bt_client.is_connected and bt_client.connected_device_address:
            for device in system_devices:
                if device['address'] == bt_client.connected_device_address:
                    device['connected'] = True
        
        return jsonify({
            'status': 'success',
            'devices': system_devices
        })
    except Exception as e:
        add_log(f"Błąd podczas pobierania sparowanych urządzeń: {str(e)}", "ERROR")
        add_log(f"Stacktrace: {traceback.format_exc()}", "DEBUG")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'devices': []
        }), 500


# Nowa trasa do sprawdzania statusu połączenia dla AJAX
@app.route('/connection_status')
def connection_status():
    """Trasa do sprawdzania statusu połączenia dla AJAX"""
    is_connected = bt_client and bt_client.is_connected
    address = bt_client.connected_device_address if bt_client and bt_client.is_connected else None
    
    return jsonify({
        'connected': is_connected,
        'address': address
    })


# Trasa do symulacji połączenia (tylko do testów)
@app.route('/simulate_connection', methods=['POST'])
def simulate_connection():
    """Trasa do symulacji połączenia (tylko do testów)"""
    add_log("Otrzymano żądanie symulacji połączenia", "DEBUG")
    
    # Symulujemy połączenie
    global bt_client
    
    if bt_client:
        # Tylko symulujemy połączenie - ustawiamy flagę bez faktycznego łączenia
        bt_client.is_connected = True
        
        # Ustawiamy przykładowy adres MAC podłączonego urządzenia
        bt_client.connected_device_address = "00:11:22:33:44:55"
        global connected_device_address
        connected_device_address = "00:11:22:33:44:55"
        
        # Emitujemy sygnał połączenia
        bt_client.connected.emit()
        
        add_log("Zasymulowano połączenie z urządzeniem", "INFO")
    else:
        add_log("Bluetooth nie został zainicjalizowany", "ERROR")
    
    return redirect(url_for('index'))


# Funkcja do uruchomienia serwera Flask w osobnym wątku
def start_flask_server():
    """Uruchamia serwer Flask w osobnym wątku"""
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)


if __name__ == "__main__":
    # Inicjalizacja Qt
    qt_app = QCoreApplication(sys.argv)
    
    # Inicjalizacja Bluetooth
    if init_bluetooth():
        # Uruchom wątek Qt
        qt_thread = QtThread()
        qt_thread.start()
        
        # Uruchom Flask w osobnym wątku
        flask_thread = threading.Thread(target=start_flask_server)
        flask_thread.daemon = True
        flask_thread.start()
        
        # Uruchom główną pętlę Qt
        add_log("Uruchamiam główną pętlę Qt", "INFO")
        sys.exit(qt_app.exec())
    else:
        add_log("Nie można zainicjalizować Bluetooth. Program zakończony.", "ERROR")
        sys.exit(1)