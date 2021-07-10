package util

import (
	"strconv"
	"time"
)

func GetCurrentTime() string {
	timestamp := time.Now().Unix()
	tm := time.Unix(timestamp, 0)
	return tm.Format(time.RFC3339)
}

func GetTomorrowTime() string {
	nowSecond := time.Now().Unix()
	nowSecond += 60 * 60 * 24
	tm := time.Unix(nowSecond, 0)
	return tm.Format(time.RFC3339)
}

func IsTimeExpired(timeString string) bool {
	t, err := time.Parse(time.RFC3339, timeString)
	if err != nil {
		panic(err)
	}

	return t.Unix() < time.Now().Unix()
}

func GetCurrentUnixTime() string {
	return strconv.FormatInt(time.Now().UnixNano(), 10)
}
