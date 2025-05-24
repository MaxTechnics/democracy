<template>
    <span>Latency: {{ latency.toFixed(1) }}ms</span>
</template>

<script setup lang="ts">
import { REALTIME_SUBSCRIBE_STATES, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { onBeforeMount, onBeforeUnmount, ref } from 'vue';

const latency = ref(-1);

const props = defineProps<{
    supa_client: SupabaseClient;
}>();

// Ping channel is used to calculate roundtrip time from client to server to client
const pingChannel: RealtimeChannel = props.supa_client.channel(`ping:democracy`, {
    config: { broadcast: { ack: true } },
});

let pingIntervalId: ReturnType<typeof setInterval> | undefined;

const LATENCY_THRESHOLD = 400;
onBeforeMount(() => {
    pingChannel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            clearInterval(pingIntervalId);
            pingIntervalId = setInterval(async () => {
                const start = performance.now()
                const resp = await pingChannel.send({
                    type: 'broadcast',
                    event: 'PING',
                    payload: {}
                });

                if (resp !== 'ok') {
                    console.error('pingChannel broadcast error');
                    latency.value = -1;
                } else {
                    const end = performance.now();
                    const newLatency = end - start;

                    if (newLatency >= LATENCY_THRESHOLD) {
                        console.warn(`Roundtrip Latency for democracy surpassed ${LATENCY_THRESHOLD} ms at ${newLatency.toFixed(1)} ms`);
                    }

                    latency.value = newLatency;
                }
            }, 1000);
        }
    })
})

onBeforeUnmount(() => {
    console.log('Leaving pingchannel');
    pingChannel.unsubscribe();

})
</script>
