<script setup lang="ts">
const { siteName } = useAppConfig();
const runtimeConfig = useRuntimeConfig();
const img = useImage();

const logoUrl = runtimeConfig?.public?.LOGO ? img(runtimeConfig?.public?.LOGO) : null;
const faviconUrl = '//ae01.alicdn.com/kf/Sb38c5071993440b8939680d5ebcc081be/1449x315.png';
</script>

<template>
  <NuxtLink to="/">
    <img v-if="logoUrl" :src="logoUrl" alt="Logo" class="object-contain h-10" />
    <div v-else class="flex items-center gap-2 text-lg font-bold">
      <img :src="faviconUrl" alt="Logo" width="120" height="32" />
      <!-- <span>{{ siteName }}</span> -->
    </div>
  </NuxtLink>
</template>
