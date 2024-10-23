<script setup lang="ts">
const { wooNuxtVersionInfo } = useHelpers();
const { wishlistLink } = useAuth();
</script>

<template>
  <footer class="bg-white order-last">
    
    <div class="container border-t flex items-center justify-center mb-4">
      <div class="mr-auto">
        <!-- <Logo /> -->
        <!-- <WebsiteShortDescription /> -->
        <LangSwitcher class="mt-4" />
      </div>
      <div class="copywrite">
        <p class="py-4 text-xs text-center">
          <a href="https://aliexpress.com.et" :title="`WooNuxt v${wooNuxtVersionInfo}`">{{ `AliExpress ${'With'}` }}</a> - 
          <a href="https://aliexpress.com.et" title="Scott Kennedy - Web Developer" target="_blank">Africom Technologies</a>
        </p>
      </div>
      <SocialIcons class="ml-auto" />
    </div>
  </footer>
</template>

<style scoped lang="postcss">
a {
  @apply hover:underline;
}
</style>
