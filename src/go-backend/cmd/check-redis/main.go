package main

import (
	"context"
	"fmt"
	"log"

	"github.com/go-redis/redis/v8"
)

func main() {
	opt, err := redis.ParseURL("")
	if err != nil {
		log.Fatal(err)
	}
	client := redis.NewClient(opt)
	ctx := context.Background()

	// Test connection
	pong, err := client.Ping(ctx).Result()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected:", pong)

	// Get all whitelist keys
	keys, err := client.Keys(ctx, "whitelist:*").Result()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Found %d keys in whitelist\n", len(keys))

	for _, key := range keys {
		val, err := client.Get(ctx, key).Result()
		if err != nil {
			fmt.Printf("Error getting %s: %v\n", key, err)
		} else {
			fmt.Printf("Key: %s\nValue: %s\n\n", key, val)
		}
	}
}
