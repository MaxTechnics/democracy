<template>
    <component :is="icon" :size="size" :color="color" :stroke-width="strokeWidth" :default-class="defaultClass" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import * as icons from 'lucide-vue-next';

interface LucideIconProps {
    name: keyof typeof icons;
    size?: number;
    color?: string;
    strokeWidth?: number;
    defaultClass?: string;
}

const props = defineProps<LucideIconProps>()

const icon = computed(() => icons[props.name]);
</script>
