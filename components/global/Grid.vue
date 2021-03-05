<template>
  <div id="grid" ref="grid" class="relative min-w-full min-h-full">
    <div
      ref="helpers"
      class="absolute min-w-full min-h-full pointer-events-none z-max"
    ></div>
    <template v-for="(item, index) in items">
      <div
        :key="index"
        class="absolute grid-item grid-item-animate"
        :data-id="item.id"
        :style="itemStyle(item)"
      >
        <slot
          name="body"
          :item="item"
          :position="findItemPosition(item.id)"
          :index="index"
        ></slot>
      </div>
    </template>
    <button
      v-if="!testMode"
      class="absolute border-none cursor-pointer bg-brown-900 text-white hover:bg-opacity-70 hover:text-yellow-500 top-0 -left-32 shadow px-4 py-3 text-base font-medium leading-none min-w-10.5 rounded-xl"
      @click="reset()"
    >
      Reset
    </button>
  </div>
</template>

<script>
import { Draggable } from '~/common/utils/draggable'
import { Rect, Point } from '~/common/utils/geometry'

export default {
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    columns: {
      type: Number,
      default: 6,
    },
    gap: {
      type: Number,
      default: 30,
    },
  },
  data: () => ({
    testMode: true, // Поставить false для реального перемещения
    showHelpers: true, // Поставить false чтобы выключить хелперы
    currentMoveId: null,
    positionSortPriority: 3,
    sizeSortPriority: 10,
    indexSortPriority: 100,
    gridSize: { width: 0, height: 0 },
    isMounted: false,
    lastIndex: 0,
    cachedLayout: [],
    cachedPosition: [],
  }),
  computed: {
    gridSizePadding() {
      return Rect.fromFrame({
        top: 0 - this.gap,
        left: 0 - this.gap,
        width: this.gridSize.width + this.gap,
        height: this.gridSize.height + this.gap,
      })
    },
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize)
      setTimeout(() => {
        this.onResize()
        this.initDraggable()
      }, 100)
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    reset() {
      this.prepare()
    },
    prepare() {
      this.cachedPosition.splice(0)
      const tmp = []

      this.items.forEach((item) => {
        tmp.push({
          id: item.id,
          rect: this.prepareItemLayout(item),
        })
      })

      this.$set(this, 'cachedLayout', tmp)
    },
    prepareItemLayout(item) {
      const position = item.position

      const rect = new Rect(
        position.x,
        position.y,
        position.width,
        position.height
      )

      this.cachedPosition.push({
        id: item.id,
        rect,
      })

      return this.calculateRect(position)
    },
    findItem(id) {
      return this.items.find((c) => c.id === id)
    },
    findItemLayout(id) {
      return this.cachedLayout.find((c) => c.id === id)
    },
    findItemPosition(id) {
      return this.cachedPosition.find((c) => c.id === id)
    },
    findNewPosition(fromId, toId, point) {
      const toRect = this.findItemLayout(toId).rect
      const fromPosition = this.findItemPosition(fromId).rect
      const blockSize = this.gridSize.width / this.columns

      let calculatedX = parseInt(
        Math.round(
          // (point.left - (fromRect.width / 2) * blockSize) / blockSize
          (toRect.left - (fromPosition.width / 2) * blockSize) / blockSize
        )
      )
      let calculatedY = parseInt(
        Math.round(
          // (point.top - (fromRect.height / 2) * blockSize) / blockSize
          (toRect.top - (fromPosition.height / 2) * blockSize) / blockSize
        )
      )

      if (fromPosition.width > 1) {
        calculatedX -= calculatedX % 2
        calculatedY -= calculatedY % 2
      }

      return Rect.fromFrame({
        left: calculatedX,
        top: calculatedY,
        width: fromPosition.width,
        height: fromPosition.height,
      })
    },
    swapItems(fromId, toId, point) {
      let newPosition = this.findNewPosition(fromId, toId, point)
      const itemPosition = this.findItemPosition(fromId).rect
      const lastPosition = itemPosition

      if (newPosition.maxX > this.columns) {
        const edgeDiff = newPosition.maxX - this.columns
        newPosition.x -= edgeDiff
      }

      if (newPosition.maxY > this.gridMaxY()) {
        const edgeDiff = newPosition.maxY - this.gridMaxY()
        newPosition.y -= edgeDiff
      }

      if (
        !this.cachedPosition.filter((c) => c.rect.y >= newPosition.y).length
      ) {
        newPosition = itemPosition
      }
      if (newPosition.equals(itemPosition)) {
        return
      }

      let isSwapped = false

      const biggerItem = this.cachedPosition.find((c) => {
        return (
          c.rect.intersects(newPosition) && c.rect.width > 1 && c.id !== fromId
        )
      })

      if (
        biggerItem &&
        (biggerItem.rect.width > newPosition.width ||
          biggerItem.rect.height > newPosition.height)
      ) {
        let newBiggerBlockX = lastPosition.x - (lastPosition.x % 2)
        let newBiggerBlockY = lastPosition.y - (lastPosition.y % 2)

        if (
          !(
            (biggerItem.rect.y >= lastPosition.y &&
              biggerItem.rect.maxY <= lastPosition.maxY) ||
            (lastPosition.y >= biggerItem.rect.y &&
              lastPosition.maxY <= biggerItem.rect.maxY)
          )
        ) {
          newBiggerBlockX = biggerItem.rect.x
        } else {
          newBiggerBlockY = biggerItem.rect.y
        }

        const newBiggerBlockPosition = Rect.fromFrame({
          left: newBiggerBlockX,
          top: newBiggerBlockY,
          width: biggerItem.rect.width,
          height: biggerItem.rect.height,
        })

        if (newBiggerBlockPosition.maxX > this.columns) {
          const edgeDiff = newBiggerBlockPosition.maxX - this.columns
          newBiggerBlockPosition.x -= edgeDiff
        }

        if (!newBiggerBlockPosition.intersects(newPosition)) {
          this.clearHelpers()
          this.swapIntersects(fromId, newPosition, newBiggerBlockPosition)

          if (this.showHelpers) {
            this.createHelper(toId, 'blue', newBiggerBlockPosition)
          }

          if (!this.testMode) {
            this.moveItem(biggerItem.id, newBiggerBlockPosition)
          }

          isSwapped = true
        }
      } else {
        this.swapIntersects(fromId, lastPosition, newPosition)

        if (this.showHelpers) {
          this.clearHelpers()
          this.createHelper(fromId, 'green', lastPosition)
          this.createHelper(toId, 'blue', newPosition)
        }
        if (!this.testMode) {
          this.moveItem(fromId, newPosition)
        }

        isSwapped = true
      }

      if (isSwapped) {
        // this.autoFill()
      }
    },
    moveItem(id, rect) {
      const itemPosition = this.findItemPosition(id)
      const itemLayout = this.findItemLayout(id)
      if (itemPosition && itemLayout) {
        itemPosition.rect = rect

        const newRect = this.calculateRect(rect)
        itemLayout.rect.x = newRect.x
        itemLayout.rect.y = newRect.y
      }
    },
    swapIntersects(fromId, fromPosition, toPosition) {
      const intersects = this.cachedPosition.filter((c) => {
        return c.rect.intersects(toPosition)
      })

      if (!intersects.length) {
        return
      }

      const intersectsMinX =
        intersects.reduce((l, r) => (l.rect.x < r.rect.x ? l : r))?.rect?.x || 0
      const intersectsMinY =
        intersects.reduce((l, r) => (l.rect.y < r.rect.y ? l : l))?.rect?.y || 0

      let diffX = 0
      let diffY = 0

      if (fromPosition.x > intersectsMinX) {
        diffX = toPosition.width
      } else if (fromPosition.x < intersectsMinX) {
        diffX = -toPosition.width
      } else {
        diffX = 0
      }

      if (fromPosition.y > intersectsMinY) {
        diffY = toPosition.height
      } else if (fromPosition.y < intersectsMinY) {
        diffY = -toPosition.height
      } else {
        diffY = 0
      }

      intersects.forEach((i) => {
        const newPosition = Rect.fromFrame({
          left: i.rect.x + diffX,
          top: i.rect.y + diffY,
          width: i.rect.width,
          height: i.rect.height,
        })

        if (this.showHelpers) {
          this.createHelper(
            i.id,
            i.id === fromId ? 'green' : 'yellow',
            newPosition
          )
        }

        if (!this.testMode) {
          this.moveItem(i.id, newPosition)
        }
      })
    },
    calculateRect(rect) {
      const size = {
        width: (this.gridSizePadding.width / this.columns) * rect.width,
        height: (this.gridSizePadding.width / this.columns) * rect.height,
      }

      const position = {
        top:
          this.gridSizePadding.top +
          (this.gridSizePadding.width / this.columns) * rect.y,
        left:
          this.gridSizePadding.left +
          (this.gridSizePadding.width / this.columns) * rect.x,
      }

      return Rect.fromFrame({
        top: Math.ceil(position.top + this.gap),
        left: Math.ceil(position.left + this.gap),
        width: Math.ceil(size.width - this.gap),
        height: Math.ceil(size.height - this.gap),
      })
    },
    itemRect(index) {
      const tmp = this.items[index].rect
      tmp.index = index
      return tmp
    },
    itemStyle(item) {
      const i = this.findItemLayout(item.id)
      if (i) {
        return i.rect.frame
      }
      return null
    },
    gridMaxY() {
      return (
        this.cachedPosition.reduce((l, r) => (l.rect.y > r.rect.y ? l : r))
          ?.rect?.y || 0
      )
    },
    autoFill(sorted = false) {
      const sortedItems = this.cachedPosition.sort((c1, c2) => {
        const x =
          c1.rect.x > c2.rect.x
            ? this.positionSortPriority
            : c1.rect.x < c2.rect.x
            ? -this.positionSortPriority
            : 0

        const y =
          c1.rect.y > c2.rect.y
            ? this.positionSortPriority
            : c1.rect.y < c2.rect.y
            ? -this.positionSortPriority
            : 0

        const width =
          c1.rect.width > c2.rect.width
            ? this.sizeSortPriority
            : c1.rect.width < c2.rect.width
            ? -this.sizeSortPriority
            : 0

        const height =
          c1.rect.height > c2.rect.height
            ? this.sizeSortPriority
            : c1.rect.height < c2.rect.height
            ? -this.sizeSortPriority
            : 0

        // let indexPath = firstIndexPath.item > secondIndexPath.item ? indexSortPriority
        //   : (firstIndexPath.item < secondIndexPath.item ? -indexPathSortPriority : 0)

        return x + y + width + height > 0 // + indexPath > 0
      })

      if (sorted) {
        this.cachedPosition.splice(0)
      }

      sortedItems.forEach((item) => {
        const availablePosition = new Point(0, 0)

        let isBreak = false
        while (!isBreak) {
          if (
            this.cachedPosition.filter((c) => {
              const r = new Rect(
                availablePosition.x,
                availablePosition.y,
                item.rect.width,
                item.rect.height
              )
              return c.rect.intersects(r) && c.id !== item.id
            }).length
          ) {
            if (availablePosition.x + item.rect.width >= this.columns) {
              availablePosition.y += item.rect.width > 1 ? 2 : 1
              availablePosition.x = 0
            } else {
              availablePosition.x += item.rect.width > 1 ? 2 : 1
            }
          } else {
            isBreak = true
          }
        }

        if (
          !(
            availablePosition.x === item.rect.x &&
            availablePosition.y === item.rect.y
          ) ||
          sorted
        ) {
          const newPosition = new Rect(
            availablePosition.x,
            availablePosition.y,
            item.rect.width,
            item.rect.height
          )
          this.moveItem(item.id, newPosition)
        }
      })
    },
    onResize() {
      this.gridSize.width = this.$refs.grid.clientWidth
      this.gridSize.height = this.$refs.grid.clientHeight

      this.prepare()
    },
    initDraggable() {
      const draggable = new Draggable(this.$refs.grid, {
        draggable: '.grid-item',
        classes: {
          'source:dragging': 'opacity-0',
        },
        distance: 0,
      })
      draggable.on('drag:start', (e) => {
        e.data.source.classList.remove('grid-item-animate')
      })
      draggable.on('drag:stop', (e) => {
        this.clearHelpers()
      })
      draggable.on('drag:over', (e) => {
        if (e.data.over !== e.data.source) {
          const fromId = parseInt(e.data.source.dataset.id)
          const toId = parseInt(e.data.over.dataset.id)

          if (this.currentMoveId) {
            return
          }
          this.currentMoveId = this.fromId

          const targetRect = this.$refs.grid.getBoundingClientRect()
          const point = {
            x: e.data.sensorEvent.data.clientX - targetRect.left,
            y: e.data.sensorEvent.data.clientY - targetRect.top,
          }

          this.swapItems(fromId, toId, point)

          const item = this.findItemLayout(fromId)

          e.data.source.style = item.rect.frame

          this.currentMoveId = null
        }
      })
    },
    createHelper(id, color, position, border = 'dashed') {
      const rect = this.calculateRect(position)
      const cls =
        'absolute flex items-center w-10 h-10 border border-' +
        color +
        '-500 border-' +
        border +
        ' opacity-0 helper place-content-center z-max rounded-3xl grid-item-animate'
      const template =
        '<div class="' +
        cls +
        '"><div class="font-bold text-' +
        color +
        '-500">' +
        id +
        '</div></div>'
      const helper = $(template).css(rect.frame).appendTo($(this.$refs.helpers))
      return helper
    },
    clearHelpers() {
      $(this.$refs.helpers).html('')
    },
  },
}
</script>

<style lang="scss">
.draggable-container--is-dragging {
  .helper {
    opacity: 1;
  }
}
</style>
