<template>
  <main @click="test">
    <Fragment v-if="!voteActive">
      <h1>Nothing to vote</h1>
    </Fragment>

    <Fragment v-else>
      <h1>Democracy time!</h1>
      <button>testo</button>
      <button>testo</button>
      <button>testo</button>
      <input type="text" v-model="field">
    </Fragment>

    <div class="wee_little_debug_box">
      <span>Wakelock supported: {{ isSupported }}</span>
      <span>Wakelock active: {{ isActive }}</span>
    </div>
  </main>

  <Transition name="slowfade">
    <BlobbyBackground v-if="showBg" />
  </Transition>
  <Toaster />
</template>

<script setup lang="ts">
import BlobbyBackground from './components/BlobbyBackground.vue';
import 'vue-sonner/style.css';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Toaster, toast } from 'vue-sonner';
import { useWakeLock } from '@vueuse/core';
import Fragment from './components/Fragment.vue';

const { isSupported, isActive, forceRequest, request, release } = useWakeLock()

const voteActive = ref(false);

const field = ref('');

const showBg = computed(() => {
  return voteActive.value;
});

const test = () => {
  voteActive.value = !voteActive.value
}

const testPromise = new Promise((r, e) => {
  setTimeout(r, 3000);
});

toast.promise(testPromise, {
  loading: 'Loading...',
  success: () => {
    return ` toast has been added`;
  },
  error: (data: any) => 'Error',
});

onMounted(() => {
  // request('screen');
})

onBeforeUnmount(() => {
  release();
})
</script>

<style lang="scss" scoped>
.slowfade-enter-active,
.slowfade-leave-active {
  transition: all 2.5s cubic-bezier(0.4, 0.14, 0.3, 1);
  /* Carbon motion expressive */
}

.slowfade-enter-from,
.slowfade-leave-to {
  opacity: 0;
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
  
  &:hover,
  &:active {
    background-color: white;
    color: black;
    transition: all 0.3 ease;
  }
}
</style>
