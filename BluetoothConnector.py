from PySide6.QtBluetooth import QBluetoothDeviceDiscoveryAgent, QBluetoothDeviceInfo, QBluetoothLocalDevice, QBluetoothAddress
from PySide6.QtCore import QObject, QCoreApplication 
import sys


class Scanner(QObject):
    def __init__(self):
        super().__init__()
        self.discoveryAgent = QBluetoothDeviceDiscoveryAgent()

        self.discoveryAgent.deviceDiscovered.connect(self.deviceDiscovered)
        self.discoveryAgent.finished.connect(self.finished)
        self.discoveryAgent.errorOccurred.connect(self.onError)
        

        self.discoveredDevices = []

    def startDiscovery(self):
        self.discoveredDevices.clear()
        self.discoveryAgent.start()

    def deviceType(self, device):

        config = device.coreConfigurations()

        if config & QBluetoothDeviceInfo.CoreConfiguration.BaseRateCoreConfiguration:
            if config & QBluetoothDeviceInfo.CoreConfiguration.LowEnergyCoreConfiguration:
                return "Dual (BL+BLE)"
            return "Classic Bluetooth"
        elif config & QBluetoothDeviceInfo.CoreConfiguration.LowEnergyCoreConfiguration:
            return "Bluetooth Low Energy"
        else:
            return "Unknown"
    
    def device_details(self, device):
        status = self.pairingStatus(device)
        print("Znalezione urządzenie:", device.name())
        print("  Adres:", device.address().toString())
        print("  Typ:", self.deviceType(device))
        print("  Status parowania:", status)
        


    def pairingStatus(self, device):

        local_device = QBluetoothLocalDevice()
        bt_address = QBluetoothAddress(device.address())
        pairing_status = local_device.pairingStatus(bt_address)

        if pairing_status == QBluetoothLocalDevice.Pairing.Unpaired:
            return "Unpaired"
        elif pairing_status == QBluetoothLocalDevice.Pairing.Paired:
            return "Paired"
        elif pairing_status == QBluetoothLocalDevice.Pairing.AuthorizedPaired:
            return "Authorized Paired"
        else:
            return "Status unknown"

    def deviceDiscovered(self, device):
        self.discoveredDevices.append(device)
        self.device_details(device)
        
        
    def finished(self):
        print("Wyszukiwanie zakończone")
        num_of_devices = len(self.discoveryAgent.discoveredDevices())
        print(f"Liczba znaleznionych urządzeń: {num_of_devices}")

    def onError(self, error):
        print("Wystąpił błąd: ", self.discoveryAgent.errorString())

class Pairing(QObject):
    def __init__(self):
        super().__init__()
        self.localDevice = QBluetoothLocalDevice()
        self.localDevice.pairingFinished.connect(self.PairingFinished)
        self.localDevice.errorOccurred.connect(self.onError)
    
    def PairingFinished(self):
        print("Parowanie zakończone")

    def onError(self, error):
        if error == QBluetoothLocalDevice.Error.PairingError:
            print("Wystąpił błąd podczas parowania")
        elif error == QBluetoothLocalDevice.Error.MissingPermissionsError:
            print("Brak wymaganych uprawnień")
        else:
            print("Wystąpił nieznany błąd")

    def devicePairing(self, address_str):
        address = QBluetoothAddress(address_str)
        print(f"Rozpoczynam parowanie z urządzeniem {address_str}...")
        self.localDevice.requestPairing(address, QBluetoothLocalDevice.Pairing.Paired)

    def deviceUnpairing(self, address_str):
        address = QBluetoothAddress(address_str)
        print(f"Rozparowywanie z urządzeniem {address_str}...")
        self.localDevice.requestPairing(address, QBluetoothLocalDevice.Pairing.Unpaired)

if __name__ == "__main__":
    
    app = QCoreApplication(sys.argv)
    scanner = Scanner()
    pairing_manager = Pairing()
    device_address = "B8:D5:0B:E7:C7:0B"  # Przykładowy adres MAC
    pairing_manager.devicePairing(device_address)
    #pairing_manager.deviceUnpairing()
    
    scanner.startDiscovery()
    app.exec()
            