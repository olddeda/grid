<template>
  <div class="flex flex-grow mx-auto max-w-4xl h-full">
    <grid :items="items">
      <template #body="{ item, position }">
        <div
          class="flex flex-col items-center place-content-center min-w-full min-h-full bg-brown-900 shadow transition duration-500 ease-in-out transform-gpu hover:scale-102.5 cursor-pointer rounded-3xl select-none"
        >
          <div class="text-2xl text-white">{{ item.id }}</div>
          <div v-if="position" class="mt-2 text-base text-white">
            {{ position.rect }}
          </div>
        </div>
      </template>
    </grid>
  </div>
</template>

<script>
export default {
  data: () => ({
    items: [
      { id: 0, position: { x: 0, y: 0, width: 4, height: 2 } },
      { id: 1, position: { x: 4, y: 0, width: 2, height: 2 } },
      { id: 2, position: { x: 0, y: 2, width: 3, height: 2 } },
      { id: 3, position: { x: 3, y: 3, width: 1, height: 1 } },
      { id: 4, position: { x: 4, y: 3, width: 1, height: 1 } },
      { id: 6, position: { x: 5, y: 3, width: 1, height: 1 } },
      { id: 7, position: { x: 3, y: 2, width: 1, height: 1 } },
      { id: 8, position: { x: 4, y: 2, width: 1, height: 1 } },
      { id: 9, position: { x: 5, y: 2, width: 1, height: 1 } },
      { id: 10, position: { x: 3, y: 4, width: 3, height: 2 } },
      { id: 11, position: { x: 0, y: 4, width: 1, height: 1 } },
      { id: 12, position: { x: 1, y: 4, width: 1, height: 1 } },
      { id: 13, position: { x: 2, y: 4, width: 1, height: 1 } },
      { id: 14, position: { x: 0, y: 5, width: 1, height: 1 } },
      { id: 15, position: { x: 1, y: 5, width: 1, height: 1 } },
      { id: 16, position: { x: 2, y: 5, width: 1, height: 1 } },
    ],
  }),
}
</script>
