<script setup lang="ts">
import { RadarChart } from 'echarts/charts';
import { GraphicComponent, RadarComponent } from 'echarts/components';
import type { EChartsType } from 'echarts/core';
import { init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { onMounted, onScopeDispose, ref, watch } from 'vue';

import type { ReportContent } from '../model/contracts';
import { dimensionLabels } from '../model/labels';
import { radarGeometry } from '../model/radar';

use([RadarChart, RadarComponent, GraphicComponent, SVGRenderer]);
const props = defineProps<{ profile: NonNullable<ReportContent['profile']> }>();
const container = ref<HTMLElement>();
let chart: EChartsType | undefined, observer: ResizeObserver | undefined;
function render() {
  if (!container.value || !chart) return;
  chart.resize();
  const geometry = radarGeometry(
    props.profile,
    container.value.clientWidth,
    container.value.clientHeight,
  );
  const css = getComputedStyle(container.value),
    color = css.getPropertyValue('--brand').trim(),
    text = css.getPropertyValue('--text').trim(),
    border = css.getPropertyValue('--border').trim();
  chart.setOption(
    {
      animation: false,
      radar: {
        center: [geometry.cx, geometry.cy],
        radius: geometry.radius,
        startAngle: 90,
        indicator: props.profile.judgments.map((item) => ({
          name: dimensionLabels[item.dimension],
          max: 100,
        })),
        axisName: { color: text },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: border } },
        splitLine: { lineStyle: { color: border } },
      },
      series: [{ type: 'radar', data: [] }],
      graphic: [
        ...geometry.edges.map((edge) => ({
          type: 'line',
          shape: { x1: edge.from.x, y1: edge.from.y, x2: edge.to.x, y2: edge.to.y },
          style: { stroke: color, lineWidth: 2 },
        })),
        ...geometry.points.map((point) => ({
          type: 'circle',
          shape: { cx: point.x, cy: point.y, r: 4 },
          style: { fill: color },
        })),
      ],
    },
    true,
  );
}
onMounted(() => {
  if (!container.value) return;
  chart = init(container.value, undefined, { renderer: 'svg' });
  observer = new ResizeObserver(render);
  observer.observe(container.value);
  render();
});
watch(() => props.profile, render, { deep: true });
onScopeDispose(() => {
  observer?.disconnect();
  chart?.dispose();
});
</script>
<template>
  <div
    ref="container"
    class="radar"
    role="img"
    aria-label="六维画像图；仅显示证据充分维度的后端分值，详细值见下方表格"
  />
</template>
<style scoped>
.radar {
  width: 100%;
  height: 25rem;
  max-width: 42rem;
}
</style>
