<template>
	<main @click="test">
		<Fragment v-if="voteState.election === null">
			<h1>Voting inactive</h1>
		</Fragment>

		<Fragment v-else>
			<h1>{{ voteState.vote_submissions === 0 ? 'Thank you for voting' : voteState.election.title }}</h1>
			<button v-if="voteState.vote_submissions !== 0" v-for="choice in voteState.election.choice" :key="choice.id" :disabled="voteState.vote_loading" @click="handleVote(choice.id)">
				<LucideIcon :name="choice.icon" :size="24" :strokeWidth="2" /> {{ choice.name }}
			</button>
		</Fragment>

		<div class="wee_little_debug_box">
			<span>Wakelock supported: {{ isSupported }}</span>
			<span>Wakelock active: {{ isActive }}</span>
			<span>Vibin' supported: {{ vibecheck }}</span>
			<span>Latest msg: {{ latest_msg }}</span>
			<RealtimeLatency :supa_client="supabase" />
			<span>Active election: {{ voteState.election?.id || 'None' }}</span>
			<span>Remaining votes: {{ voteState.vote_submissions }}</span>
		</div>
	</main>

	<Transition name="slowfade">
		<BlobbyBackground v-if="showBg" />
	</Transition>
	<Toaster richColors position="top-center" />
</template>

<script setup lang="ts">
import BlobbyBackground from './components/BlobbyBackground.vue';
import 'vue-sonner/style.css';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import LucideIcon from './components/LucideIcon.vue';
import RealtimeLatency from './components/RealtimeLatency.vue';
import { supabase } from '@/lib/supabase';
import { Toaster, toast } from 'vue-sonner';
import { useWakeLock, useVibrate } from '@vueuse/core';
import Fragment from './components/Fragment.vue';
import type * as lucideicon from 'lucide-vue-next';

const { isSupported, isActive, forceRequest, request, release } = useWakeLock()
const { vibrate, stop, isSupported: vibecheck } = useVibrate({ pattern: [300, 100, 300] })

type VoteChoice = {
	name: string;
	icon: keyof typeof lucideicon;
	id: string;
}

interface VoteMessage {
	id: string;
	title: string;
	choice: VoteChoice[]
	votes: number; // if -1, infinite/mash voting
}

const voteActive = ref(false);
const latest_msg = ref('N/A');

const tesstdata: VoteMessage = {
	id: 'test_vote',
	title: 'Your vote counts xD',
	choice: [
		{
			name: 'Choice 1',
			icon: 'Check',
			id: 'choice_1'
		},
		{
			name: 'Choice 2',
			icon: 'X',
			id: 'choice_2'
		},
		{
			name: 'Choice 3',
			icon: 'Heart',
			id: 'choice_3'
		}
	],
	votes: -1
}

const voteState = reactive<{
	election: VoteMessage | null;
	vote_loading: boolean;
	vote_submissions: number;
}>({
	election: null,
	vote_loading: false,
	vote_submissions: 0
});

const showBg = computed(() => {
	// return voteActive.value || voteState.election !== null;
	return voteState.election !== null;
});

const startVote = (election: VoteMessage) => {
	voteState.election = election;
	voteState.vote_submissions = election.votes;
}

const endVote = () => {
	voteState.election = null;
	voteState.vote_loading = false;
	voteState.vote_submissions = 0;
}

const test = () => {
	voteActive.value = !voteActive.value
}

const voterChannel = supabase.channel('backstage', {
	config: {
		broadcast: { ack: true }
	}
});

voterChannel
	.on('broadcast', { event: 'vote_trigger' }, async ({ payload }) => {
		console.log('Got message', payload)
		latest_msg.value = `${payload.vote_action.id}`

		startVote(payload.vote_action);

		vibrate();
		const serverResponse = await voterChannel.send({ type: 'broadcast', event: 'acknowledge' });
		console.log('vote_trigger ack serverResponse', serverResponse)
	})
	.on('broadcast', { event: 'vote_end' }, async () => {
		console.log('Got message')
		latest_msg.value = `vote_end`;

		endVote();

		const serverResponse = await voterChannel.send({ type: 'broadcast', event: 'acknowledge' });
		console.log('vote_end ack serverResponse', serverResponse)
	})
	.subscribe();

const d = () => new Promise(r => setTimeout(r, 250));

const _submitVote = async (id: string) => {
	if (voteState.vote_submissions === 0) throw 'No votes remaining';
	voteState.vote_loading = true;
	await d()
	const resp = await voterChannel.send({
		type: 'broadcast',
		event: 'vote_submission',
		payload: { choice_id: id }
	});
	voteState.vote_loading = false;

	if (resp === 'ok') return;
	throw resp; // timeout or failed
}

const handleVote = (id: string) => {
	toast.promise(_submitVote(id), {
		loading: 'Submitting vote',
		success: () => {
			if (voteState.vote_submissions !== -1) voteState.vote_submissions--;
			return `Vote cast! ${[-1, 0].includes(voteState.vote_submissions) ? 'Thank you!' : `You have ${voteState.vote_submissions} vote(s) left.`}`
		},
		error: (e: string) => {
			return `Vote failed to cast: ${e}`;
		}
	})
}

onMounted(() => {
	request('screen');
})

onBeforeUnmount(() => {
	release();
	voterChannel.unsubscribe();
})
</script>

<style lang="scss" scoped>
.slowfade-enter-active {
	transition: all 2.5s cubic-bezier(0.4, 0.14, 0.3, 1);
}

.slowfade-leave-active {
  transition: all 4.5s cubic-bezier(0.4, 0.14, 0.3, 1);
  /* Carbon motion expressive */
}

.slowfade-enter-from,
.slowfade-leave-to {
  opacity: 0;
}

h1 {
	font-size: clamp(1.5rem, 5vw, 2rem);
}

main {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.wee_little_debug_box {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  top: 1rem;
  right: 1rem;
  max-width: 400px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 1rem;
  padding: 1rem;

  span {
    background-color: #43b581;
    border-radius: 0.25rem;
    padding: 0.25rem;
    font-size: 0.75rem;
  }
}

button {
	border: 2px white solid;
	color: white;
	padding: 0.5rem;
	font-size: 1.25rem;
	border-radius: 0.5rem;
	background-color: transparent;
	width: 200px;
	transition: all 0.3 ease;
	cursor: pointer;
	display: flex;
	gap: 0.25rem;
	align-items: center;
  
  &:hover,
  &:active {
    background-color: white;
	color: black;
    transition: all 0.3 ease;
  }

  &:disabled {
	background-color: transparent;
	cursor: not-allowed;
	border-color: slategray;
	color: slategray;
  }
}
</style>
