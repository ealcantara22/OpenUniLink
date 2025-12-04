package wireless

import (
	"encoding/hex"
	"fmt"
	"math"
	"strings"

	"time"

	"github.com/google/gousb"

	"github.com/ealcantara22/OpenUniLink/internal/usb"
)

const (
	RFSenderVID = 0x0416
	RFSenderPID = 0x8040
	RFRecvVID   = 0x0416
	RFRecvPID   = 0x8041

	RFGetDevCmd    = 0x10
	RFPacketHeader = 0x10
	RFChunkSize    = 60
	RFPayloadSize  = 240
	RFPageStride   = 434
	MaxDevicesPage = 10
)

type WirelessError struct {
	msg string
}

func (e WirelessError) Error() string { return e.msg }

type WirelessDeviceInfo struct {
	Mac             string
	MasterMac       string
	Channel         uint8
	RxType          uint8
	DeviceType      uint8
	FanCount        int
	PwmValues       [4]uint8
	FanRPM          [4]uint16
	CommandSequence uint8
	Raw             []byte
	IsBound         bool
}

type WirelessSnapshot struct {
	Devices []WirelessDeviceInfo
	Raw     []byte
}

type WirelessTransceiver struct {
	sender *usb.USBEndpointDevice
	recv   *usb.USBEndpointDevice
}

func NewWirelessTransceiver(timeout time.Duration) (*WirelessTransceiver, error) {
	sender, err := usb.NewUSBEndpointDevice(
		gousb.ID(RFSenderVID),
		gousb.ID(RFSenderPID),
		usb.USBEndpointDeviceOptions{
			WriteEndpoint: 0x01,
			ReadEndpoint:  0x81,
			InterfaceNum:  0,
			Timeout:       timeout,
		},
	)
	if err != nil {
		return nil, err
	}

	recv, err := usb.NewUSBEndpointDevice(
		gousb.ID(RFRecvVID),
		gousb.ID(RFRecvPID),
		usb.USBEndpointDeviceOptions{
			WriteEndpoint: 0x01,
			ReadEndpoint:  0x81,
			InterfaceNum:  0,
			Timeout:       timeout,
		},
	)
	if err != nil {
		sender.Close()
		return nil, err
	}

	return &WirelessTransceiver{sender: sender, recv: recv}, nil
}

func (w *WirelessTransceiver) Close() {
	if w.sender != nil {
		w.sender.Close()
	}
	if w.recv != nil {
		w.recv.Close()
	}
}

func (w *WirelessTransceiver) ListDevices() (*WirelessSnapshot, error) {
	page1Count, buf1, err := w.fetchPage(1)
	if err != nil {
		return nil, err
	}
	expectedPages := int(math.Max(1, math.Ceil(float64(page1Count)/float64(MaxDevicesPage))))
	var devCount int
	var payload []byte
	if expectedPages == 1 {
		devCount = page1Count
		payload = buf1
	} else {
		devCount2, buf2, err := w.fetchPage(expectedPages)
		if err != nil {
			return nil, err
		}
		devCount = devCount2
		payload = buf2
	}

	devices := parseDevices(devCount, payload)
	return &WirelessSnapshot{
		Devices: devices,
		Raw:     payload,
	}, nil
}

func (w *WirelessTransceiver) fetchPage(pageCount int) (int, []byte, error) {
	cmd := make([]byte, 64)
	cmd[0] = RFGetDevCmd
	cmd[1] = byte(pageCount & 0xff)

	if _, err := w.recv.Write(cmd); err != nil {
		return 0, nil, err
	}

	totalLen := RFPageStride * pageCount
	var buffer []byte
	requestSize := 512

	for len(buffer) < totalLen {
		chunk, err := w.recv.Read(requestSize)
		if err != nil {
			// We don't have an overflow string in gousb errors; treat all errors as fatal for now
			return 0, nil, err
		}
		if len(chunk) == 0 {
			break
		}
		buffer = append(buffer, chunk...)
		if len(chunk) < requestSize {
			break
		}
	}

	if len(buffer) == 0 {
		return 0, nil, WirelessError{"RF receiver returned no data"}
	}

	if len(buffer) > totalLen {
		buffer = buffer[:totalLen]
	}

	if buffer[0] != RFGetDevCmd {
		return 0, nil, WirelessError{fmt.Sprintf("unexpected RF header 0x%02x", buffer[0])}
	}

	deviceCount := int(buffer[1])
	return deviceCount, buffer, nil
}

func parseDevices(count int, payload []byte) []WirelessDeviceInfo {
	devices := make([]WirelessDeviceInfo, 0, count)
	offset := 4
	for i := 0; i < count; i++ {
		if offset+42 > len(payload) {
			break
		}
		record := payload[offset : offset+42]
		if record[41] != 28 {
			offset += 42
			continue
		}
		mac := bytesToMac(record[0:6])
		master := bytesToMac(record[6:12])
		channel := record[12]
		rxType := record[13]
		devType := record[18]
		fanNum := int(record[19])
		if fanNum >= 10 {
			fanNum -= 10
		}

		pwmVals := [4]uint8{record[36], record[37], record[38], record[39]}
		var rpmVals [4]uint16
		for i := 0; i < 4; i++ {
			hi := uint16(record[28+2*i])
			lo := uint16(record[29+2*i])
			rpmVals[i] = (hi << 8) | lo
		}
		cmdSeq := record[40]
		isBound := master != "00:00:00:00:00:00"

		devices = append(devices, WirelessDeviceInfo{
			Mac:             mac,
			MasterMac:       master,
			Channel:         channel,
			RxType:          rxType,
			DeviceType:      devType,
			FanCount:        fanNum,
			PwmValues:       pwmVals,
			FanRPM:          rpmVals,
			CommandSequence: cmdSeq,
			Raw:             append([]byte(nil), record...),
			IsBound:         isBound,
		})
		offset += 42
	}
	return devices
}

func bytesToMac(b []byte) string {
	parts := make([]string, 0, 6)
	for i := 0; i < len(b) && i < 6; i++ {
		parts = append(parts, fmt.Sprintf("%02x", b[i]))
	}
	return strings.Join(parts, ":")
}

func hexDump(b []byte) string {
	return hex.EncodeToString(b)
}
