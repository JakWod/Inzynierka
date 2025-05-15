import sys
import time
from PySide6.QtCore import QCoreApplication, QObject, QTimer, Signal, QEventLoop
from PySide6.QtBluetooth import (QBluetoothDeviceDiscoveryAgent,
                                QBluetoothSocket, QBluetoothServiceInfo, QBluetoothAddress, QBluetoothLocalDevice)

class BluetoothConsoleClient(QObject):
    """Klasa obsługująca komunikację Bluetooth w aplikacji konsolowej"""
    
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
    
    def _create_socket(self):
        """Tworzy nowy socket Bluetooth"""
        # Jeśli już mamy socket, zamknij go
        if hasattr(self, 'socket') and self.socket:
            self.socket.disconnectFromService()
            self.socket.close()
            
        # Utwórz nowy socket
        self.socket = QBluetoothSocket(QBluetoothServiceInfo.Protocol.RfcommProtocol)
        self.socket.connected.connect(self._on_connected)
        self.socket.disconnected.connect(self._on_disconnected)
        self.socket.readyRead.connect(self._on_ready_read)
        self.socket.errorOccurred.connect(self._on_socket_error)
    
    def connect_to_device(self, address_str, port=1):
        """Łączy się z urządzeniem o podanym adresie MAC"""
        try:
            # Jeśli mamy aktywne połączenie, najpierw rozłącz
            if self.is_connected:
                self.disconnect()
                
            # Upewnij się, że socket jest w stanie niepołączonym
            if self.socket.state() != QBluetoothSocket.SocketState.UnconnectedState:
                self._create_socket()
                
            print(f"Próba połączenia z urządzeniem {address_str}...")
            address = QBluetoothAddress(address_str)
            
            # Zresetuj flagi
            self.is_connected = False
            self.connection_error = False
            self.last_error = ""
            
            # Połącz
            self.socket.connectToService(address, port)
            
            # Poczekaj na połączenie lub timeout
            loop = QEventLoop()
            
            # Timer na timeout połączenia
            timer = QTimer()
            timer.setSingleShot(True)
            timer.timeout.connect(lambda: self._connection_timeout(loop))
            timer.start(10000)  # 10 sekund na połączenie
            
            # Tymczasowe funkcje dla połączeń sygnałów
            def on_temp_connected():
                self._stop_connection_wait(loop, timer)
                
            def on_temp_error(err):
                self._connection_error(loop, timer, err)
            
            # Gdy połączenie zostanie ustanowione, zatrzymaj pętlę
            self.connected.connect(on_temp_connected)
            
            # Gdy wystąpi błąd, zatrzymaj pętlę
            self.error_occurred.connect(on_temp_error)
            
            # Uruchom pętlę i czekaj
            loop.exec()
            
            # Odłącz tymczasowe połączenia sygnałów
            self.connected.disconnect(on_temp_connected)
            self.error_occurred.disconnect(on_temp_error)
            
            # Zwróć status połączenia
            if self.is_connected:
                return True
            else:
                if self.last_error:
                    print(f"Błąd połączenia: {self.last_error}")
                else:
                    print("Timeout połączenia")
                return False
                
        except Exception as e:
            print(f"Wyjątek podczas łączenia: {str(e)}")
            return False
        

    
    def unpair_device(self, address_str):
        """Rozparowuje urządzenie w systemie Windows używając BluetoothAPI poprzez ctypes"""
        try:
            import ctypes
            from ctypes import windll, byref, Structure, WinError, POINTER, c_ubyte
            from ctypes.wintypes import BOOL, DWORD, HANDLE
            
            print("Używam Windows BluetoothAPI przez ctypes...")
            
            # Konwersja adresu MAC do formatu potrzebnego dla API
            addr_bytes = bytes.fromhex(address_str.replace(":", ""))
            addr_reversed = bytes(reversed(addr_bytes))  # Bluetooth API używa odwrotnej kolejności
            
            # Definicje struktur i stałych
            class BLUETOOTH_ADDRESS(Structure):
                _fields_ = [("addr", c_ubyte * 6)]
            
            # Ładowanie biblioteki i definicja funkcji
            bthprops = windll.LoadLibrary("bthprops.cpl")
            BluetoothRemoveDevice = bthprops.BluetoothRemoveDevice
            BluetoothRemoveDevice.argtypes = [POINTER(BLUETOOTH_ADDRESS)]
            BluetoothRemoveDevice.restype = DWORD
            
            # Przygotowanie struktury adresu
            bt_addr = BLUETOOTH_ADDRESS()
            
            # Wypełnienie adresu MAC
            for i, b in enumerate(addr_reversed):
                bt_addr.addr[i] = b
            
            # Wywołanie API do rozparowania
            result = BluetoothRemoveDevice(byref(bt_addr))
            
            if result == 0:  # ERROR_SUCCESS
                print("Rozparowanie zakończone sukcesem")
                
                    
                self.pairing_status_changed.emit(address_str, False)
                return True
            else:
                error_message = WinError(result).strerror
                print(f"Błąd rozparowania: {error_message} (kod {result})")
                return False
        
        except Exception as e:
            print(f"Wyjątek podczas rozparowania: {str(e)}")
            return False
    
    def disconnect(self):
        """Rozłącza połączenie z urządzeniem"""
        if self.socket.state() == QBluetoothSocket.SocketState.ConnectedState:
            print("Rozłączanie...")
            self.socket.disconnectFromService()
            
            # Poczekaj na rozłączenie
            timeout = 0
            while (self.socket.state() != QBluetoothSocket.SocketState.UnconnectedState and 
                   timeout < 30):
                QCoreApplication.processEvents()
                time.sleep(0.1)
                timeout += 1
                
            self.is_connected = False

            try:
                    local_device = QBluetoothLocalDevice()
                    if local_device.isValid():
                            # Save current host mode
                        current_mode = local_device.hostMode()
                            
                            # Set to powered off temporarily
                        local_device.setHostMode(QBluetoothLocalDevice.HostMode.HostPoweredOff)
                        print("Tymczasowo wyłączono Bluetooth")
                            
                            # Give it a moment
                        time.sleep(1)
                        QCoreApplication.processEvents()
                            
                        # Restore previous mode
                        local_device.setHostMode(current_mode)
                        print("Przywrócono poprzedni stan Bluetooth")

                    else:
                        print("QBluetoothLocalDevice nie jest ważny")
                        methods_tried += 1
                            
            except Exception as e:
                        print(f"Błąd podczas manipulacji trybem hosta Bluetooth: {str(e)}")
                        methods_tried += 1
            
            # Jeśli socket nadal nie jest rozłączony, utwórz nowy
            if self.socket.state() != QBluetoothSocket.SocketState.UnconnectedState:
                print("Rozłączenie nie powiodło się, tworzę nowy socket...")
                self._create_socket()
                
            return True
        return False
    
    def send_data(self, data):
        """Wysyła dane do urządzenia"""
        if not self.is_connected:
            print("Nie można wysłać danych - brak połączenia")
            return False
        
        try:
            if isinstance(data, str):
                # Jeśli to string, zakładamy że to hex
                if data.startswith("0x"):
                    data = data[2:]
                data = bytes.fromhex(data)
            
            if not isinstance(data, (bytes, bytearray)):
                print("Nieprawidłowy typ danych - wymagane bytes lub hex string")
                return False
            
            bytes_written = self.socket.write(data)
            print(f"Wysłano {bytes_written} bajtów: 0x{data.hex().upper()}")
            return bytes_written > 0
        except Exception as e:
            print(f"Błąd podczas wysyłania danych: {str(e)}")
            return False
    
    def _on_connected(self):
        """Handler połączenia"""
        print("Połączono z urządzeniem!")
        self.is_connected = True
        self.connected.emit()
    
    def _on_disconnected(self):
        """Handler rozłączenia"""
        print("Rozłączono z urządzeniem")
        self.is_connected = False
        self.disconnected.emit()
    
    def _on_ready_read(self):
        """Handler odebrania danych"""
        data = self.socket.readAll().data()
        hex_data = data.hex().upper()
        print(f"Odebrano dane: 0x{hex_data} ({len(data)} bajtów)")
        
        # Próba dekodowania ASCII
        try:
            ascii_data = data.decode('ascii')
            if any(32 <= ord(c) <= 126 for c in ascii_data):
                printable = ''.join(c if 32 <= ord(c) <= 126 else '.' for c in ascii_data)
                print(f"ASCII: {printable}")
        except UnicodeDecodeError:
            pass
            
        self.message_received.emit(data)
    
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
        print(f"Błąd socket'u: {error_message}")
        self.error_occurred.emit(error_message)
    
    def _connection_timeout(self, loop):
        """Handler timeoutu połączenia"""
        if not self.is_connected and not self.connection_error:
            print("Timeout połączenia")
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
    print("Rozpoczynam skanowanie urządzeń Bluetooth...")
    
    devices = []
    discovery_complete = False
    
    discovery_agent = QBluetoothDeviceDiscoveryAgent()
    
    #Handlery zdarzeń
    def on_device_discovered(device_info):
        devices.append(device_info)
        print(f"Znaleziono: {device_info.name()} - {device_info.address().toString()}")
    
    def on_finished():
        nonlocal discovery_complete
        discovery_complete = True
        print(f"Skanowanie zakończone. Znaleziono {len(devices)} urządzeń.")
    
    def on_error(error):
        nonlocal discovery_complete
        discovery_complete = True
        print(f"Błąd podczas skanowania: {error}")
    
    #Sygnały
    discovery_agent.deviceDiscovered.connect(on_device_discovered)
    discovery_agent.finished.connect(on_finished)
    discovery_agent.errorOccurred.connect(on_error)
    
    #Skanowanie
    discovery_agent.start()
    
    #Zakończenie skanowania
    loop = QEventLoop()
    
    #Timer do timeoutu skanowania
    timer = QTimer()
    timer.setSingleShot(True)
    timer.timeout.connect(loop.quit)
    timer.start(20000)  # 20 sekund na skanowanie
    
    #Gdy skanowanie się zakończy, zatrzymaj pętlę
    discovery_agent.finished.connect(loop.quit)
    discovery_agent.errorOccurred.connect(loop.quit)
    
    #Uruchom pętlę i czekaj
    loop.exec()
    
    #Jeśli skanowanie nadal trwa, zatrzymaj je
    if not discovery_complete:
        discovery_agent.stop()
    
    return devices




def interactive_console(bt_client):
    """Interaktywna konsola do sterowania połączeniem Bluetooth"""
    print("\n=== Konsola Bluetooth ===")
    print("Komendy:")
    print("  connect <adres MAC> - połącz z urządzeniem")
    print("  unpair <adres MAC> - rozparuj urządzenie")
    print("  disconnect - rozłącz z urządzeniem")
    print("  send <hex> - wyślij dane (format hex, np. 01A2FF)")
    print("  scan - skanuj dostępne urządzenia")
    print("  status - sprawdź status połączenia")
    print("  exit - zakończ program")
    
    while True:
        try:
            command = input("\n> ").strip()
            
            if command == "exit":
                if bt_client.is_connected:
                    bt_client.disconnect()
                break
                
            elif command.startswith("connect "):
                if bt_client.is_connected:
                    print("Najpierw rozłącz aktualne połączenie")
                    continue
                address = command.split(" ", 1)[1].strip()
                bt_client.connect_to_device(address)

            elif command.startswith("unpair "):
                address = command.split(" ", 1)[1].strip()
                if bt_client.unpair_device(address):
                    print(f"Urządzenie {address} zostało rozparowane")
                else:
                    print(f"Nie udało się rozparować urządzenia {address}")
            
            elif command == "disconnect":
                if not bt_client.is_connected:
                    print("Brak aktywnego połączenia")
                else:
                    bt_client.disconnect()
                
            elif command.startswith("send "):
                if not bt_client.is_connected:
                    print("Brak aktywnego połączenia")
                    continue
                    
                data = command.split(" ", 1)[1].strip()
                bt_client.send_data(data)
                
            elif command == "scan":
                devices = scan_devices()
                if devices:
                    print("\nZnalezione urządzenia:")
                    for i, device in enumerate(devices):
                        print(f"{i+1}. {device.name()} - {device.address().toString()}")
                else:
                    print("Nie znaleziono urządzeń")
                
            elif command == "status":
                if bt_client.is_connected:
                    print("Status: Połączony")
                else:
                    print("Status: Niepołączony")

            elif command == "help":
                print("\nDostępne komendy:")
                print("  connect <adres MAC> - połącz z urządzeniem")
                print("  unpair <adres MAC> - rozparuj urządzenie")
                print("  disconnect - rozłącz z urządzeniem")
                print("  send <hex> - wyślij dane (format hex, np. 01A2FF)")
                print("  scan - skanuj dostępne urządzenia")
                print("  status - sprawdź status połączenia")
                print("  exit - zakończ program")
                    
            else:
                print("Nieznana komenda. Wpisz 'help' aby wyświetlić dostępne komendy.")
                
        except Exception as e:
            print(f"Błąd: {str(e)}")
            
        # Przetwórz zdarzenia Qt
        QCoreApplication.processEvents()


if __name__ == "__main__":
    app = QCoreApplication(sys.argv)
    
    print("=== Bluetooth Console Client ===")
    
    # Sprawdź, czy Bluetooth jest dostępny
    local_device = QBluetoothLocalDevice()
    if not local_device.isValid():
        print("Bluetooth nie jest dostępny na tym urządzeniu")
        sys.exit(1)
        
    # Sprawdź, czy Bluetooth jest włączony
    if local_device.hostMode() == QBluetoothLocalDevice.HostMode.HostPoweredOff:
        print("Bluetooth jest wyłączony. Proszę włączyć Bluetooth i spróbować ponownie.")
        sys.exit(1)
    
    print(f"Lokalne urządzenie Bluetooth: {local_device.name()} ({local_device.address().toString()})")
    
    # Utwórz klienta Bluetooth
    bt_client = BluetoothConsoleClient()
    
    # Możesz bezpośrednio połączyć się z urządzeniem
    if len(sys.argv) > 1:
        address = sys.argv[1]
        print(f"Łączenie z urządzeniem {address}...")
        bt_client.connect_to_device(address)
    
    # Uruchom interaktywną konsolę
    interactive_console(bt_client)
    
    # Upewnij się, że wszystkie połączenia są zamknięte
    if bt_client.is_connected:
        bt_client.disconnect()
    
    print("Program zakończony.")
    sys.exit(0)