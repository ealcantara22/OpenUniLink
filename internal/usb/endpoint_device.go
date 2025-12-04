package usb

import (
	"context"
	"fmt"
	"time"

	"github.com/google/gousb"
)

type USBError struct {
	msg string
}

func (e USBError) Error() string { return e.msg }

type USBEndpoints struct {
	Out *gousb.OutEndpoint
	In  *gousb.InEndpoint
}

type USBEndpointDevice struct {
	VendorID  gousb.ID
	ProductID gousb.ID
	Timeout   time.Duration

	ctx   *gousb.Context
	dev   *gousb.Device
	cfg   *gousb.Config
	iface *gousb.Interface
	eps   USBEndpoints
}

type USBEndpointDeviceOptions struct {
	WriteEndpoint uint8 // e.g. 0x01
	ReadEndpoint  uint8 // e.g. 0x81
	InterfaceNum  int   // usually 0
	Timeout       time.Duration
}

func NewUSBEndpointDevice(vid, pid gousb.ID, opts USBEndpointDeviceOptions) (*USBEndpointDevice, error) {
	ctx := gousb.NewContext()

	dev, err := ctx.OpenDeviceWithVIDPID(vid, pid)
	if err != nil {
		ctx.Close()
		return nil, USBError{fmt.Sprintf("open device %04x:%04x failed: %v", vid, pid, err)}
	}
	if dev == nil {
		ctx.Close()
		return nil, USBError{fmt.Sprintf("device %04x:%04x not found", vid, pid)}
	}

	timeout := opts.Timeout
	if timeout == 0 {
		timeout = time.Second
	}

	// Your error said "Available config ids: [1]".
	// So explicitly select configuration 1.
	cfg, err := dev.Config(1)
	if err != nil {
		dev.Close()
		ctx.Close()
		return nil, USBError{fmt.Sprintf("open config 1 failed: %v", err)}
	}

	// Claim the specific interface + altsetting 0
	iface, err := cfg.Interface(opts.InterfaceNum, 0)
	if err != nil {
		cfg.Close()
		dev.Close()
		ctx.Close()
		return nil, USBError{fmt.Sprintf("claim interface %d alt 0 failed: %v", opts.InterfaceNum, err)}
	}

	eps := USBEndpoints{}
	for _, ep := range iface.Setting.Endpoints {
		addr := ep.Address // gousb.EndpointAddress

		if ep.Direction == gousb.EndpointDirectionIn &&
			addr == gousb.EndpointAddress(opts.ReadEndpoint) {
			in, err := iface.InEndpoint(int(addr))
			if err != nil {
				continue
			}
			eps.In = in
		}

		if ep.Direction == gousb.EndpointDirectionOut &&
			addr == gousb.EndpointAddress(opts.WriteEndpoint) {
			out, err := iface.OutEndpoint(int(addr))
			if err != nil {
				continue
			}
			eps.Out = out
		}
	}

	if eps.In == nil || eps.Out == nil {
		// didn’t find the endpoints we wanted
		iface.Close()
		cfg.Close()
		_ = dev.Close()
		ctx.Close()
		return nil, USBError{"could not locate IN/OUT endpoints"}
	}

	return &USBEndpointDevice{
		VendorID:  vid,
		ProductID: pid,
		Timeout:   timeout,
		ctx:       ctx,
		dev:       dev,
		cfg:       cfg,
		iface:     iface,
		eps:       eps,
	}, nil
}

func (d *USBEndpointDevice) Close() {
	if d.iface != nil {
		d.iface.Close()
	}
	if d.cfg != nil {
		d.cfg.Close()
	}
	if d.dev != nil {
		_ = d.dev.Close()
	}
	if d.ctx != nil {
		d.ctx.Close()
	}
}

func (d *USBEndpointDevice) Write(payload []byte) (int, error) {
	if d.eps.Out == nil {
		return 0, USBError{"no OUT endpoint"}
	}
	n, err := d.eps.Out.Write(payload)
	if err != nil {
		return n, USBError{fmt.Sprintf("USB write failed: %v", err)}
	}
	return n, nil
}

func (d *USBEndpointDevice) Read(size int) ([]byte, error) {
	if d.eps.In == nil {
		return nil, USBError{"no IN endpoint"}
	}

	buf := make([]byte, size)

	ctx, cancel := context.WithTimeout(context.Background(), d.Timeout)
	defer cancel()

	n, err := d.eps.In.ReadContext(ctx, buf)
	if err != nil {
		return nil, USBError{fmt.Sprintf("USB read failed: %v", err)}
	}

	return buf[:n], nil
}

//func (d *USBEndpointDevice) Read(size int) ([]byte, error) {
//	if d.eps.In == nil {
//		return nil, USBError{"no IN endpoint"}
//	}
//	buf := make([]byte, size)
//	n, err := d.eps.In.Read(buf)
//	if err != nil {
//		return nil, USBError{fmt.Sprintf("USB read failed: %v", err)}
//	}
//	return buf[:n], nil
//}
