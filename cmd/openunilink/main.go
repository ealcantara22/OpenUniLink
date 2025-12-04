package main

import (
	"fmt"
	"log"
	"time"

	"github.com/ealcantara22/OpenUniLink/internal/wireless"
)

func main() {
	tx, err := wireless.NewWirelessTransceiver(time.Second)
	if err != nil {
		log.Fatalf("Failed to open wireless transceiver: %v", err)
	}
	defer tx.Close()

	snap, err := tx.ListDevices()
	if err != nil {
		log.Fatalf("ListDevices failed: %v", err)
	}

	fmt.Printf("Found %d devices\n", len(snap.Devices))
	for _, d := range snap.Devices {
		fmt.Printf("MAC=%s master=%s ch=%d rx=%d type=%d bound=%v\n",
			d.Mac, d.MasterMac, d.Channel, d.RxType, d.DeviceType, d.IsBound)
	}
}
