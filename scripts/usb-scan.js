const usb = require('usb');
const devices = usb.getDeviceList();

for (const dev of devices) {
    const d = dev.deviceDescriptor;

    console.log(
        `VID=0x${d.idVendor.toString(16).padStart(4, '0')} ` +
        `PID=0x${d.idProduct.toString(16).padStart(4, '0')}`
    );
}
