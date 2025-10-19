<script setup lang="ts">
import { ref, computed } from 'vue'
import { calculateMinorRen, startByRandom, startByTime } from './algorithm/minor-ren'
import { SIX_STARS } from './algorithm/six-stars'

type StarName = typeof SIX_STARS[number]["name"]
type SixStarItem = (typeof SIX_STARS)[number]

const starMap = new Map<StarName, SixStarItem>(SIX_STARS.map(s => [s.name as StarName, s]))

const x = ref<number | null>(null)
const y = ref<number | null>(null)
const z = ref<number | null>(null)
const resultNames = ref<[StarName, StarName, StarName] | null>(null)
const errorMsg = ref<string>("")
type Mode = 'time' | 'random' | 'custom' | 'none'
const activeMode = ref<Mode>('none')

// 自定义输入（字符串以便处理空值与前导零）
const customX = ref<string>('')
const customY = ref<string>('')
const customZ = ref<string>('')
// 仅当点击三种起课按钮后展示结果
const showResult = ref<boolean>(false)
// 加载状态：用于显示等待动画
const isLoading = ref<boolean>(false)
const waitTime = 800 // ms

function compute() {
	errorMsg.value = ""
	try {
		if (x.value == null || y.value == null || z.value == null) return
		const [a, b, c] = calculateMinorRen(x.value, y.value, z.value)
		resultNames.value = [a as StarName, b as StarName, c as StarName]
	} catch (e: any) {
		errorMsg.value = e?.message || '计算失败，请检查输入'
	}
}

function rollRandom() {
	isLoading.value = true
	showResult.value = false
	const { x: rx, y: ry, z: rz } = startByRandom(1, 60)
	customX.value = String(rx)
	customY.value = String(ry)
	customZ.value = String(rz)
	x.value = rx
	y.value = ry
	z.value = rz
	compute()
	activeMode.value = 'random'
	
	setTimeout(() => {
		isLoading.value = false
		showResult.value = true
	}, waitTime)
}

function rollByTime() {
	isLoading.value = true
	showResult.value = false
	const { x: tx, y: ty, z: tz } = startByTime()
	customX.value = String(tx)
	customY.value = String(ty)
	customZ.value = String(tz)
	x.value = tx
	y.value = ty
	z.value = tz
	compute()
	activeMode.value = 'time'
	
	setTimeout(() => {
		isLoading.value = false
		showResult.value = true
	}, waitTime)
}

function parsePositiveInt(s: unknown): number | null {
	if (s == null) return null
	const trimmed = String(s).trim()
	if (!trimmed) return null
	const n = Number(trimmed)
	if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null
	return n
}

function computeFromCustom() {
	const nx = parsePositiveInt(customX.value)
	const ny = parsePositiveInt(customY.value)
	const nz = parsePositiveInt(customZ.value)
	if (nx == null || ny == null || nz == null) {
		errorMsg.value = '请输入三个大于等于 1 的正整数'
		return
	}
	isLoading.value = true
	showResult.value = false
	x.value = nx
	y.value = ny
	z.value = nz
	compute()
	activeMode.value = 'custom'
	
	setTimeout(() => {
		isLoading.value = false
		showResult.value = true
	}, waitTime)
}

// 当输入变动时，暂不显示结果，等待显式点击计算按钮
function handleInputChange() {
  errorMsg.value = ''
	showResult.value = false
	activeMode.value = 'none'
}

const resultDetails = computed(() => {
	if (!resultNames.value) return [] as Array<{ pos: number; name: StarName; item: SixStarItem }>
	return resultNames.value.map((n, i) => ({ pos: i + 1, name: n, item: starMap.get(n)! }))
})

// 所有六个断词的详细信息，用于在"断词详解"中展示
const allStarsDetails = computed(() => {
	if (!resultNames.value) return []
	
	// 创建一个 Map 记录起课结果中每个星的所有位置（序号数组）
	const resultIndexMap = new Map<StarName, number[]>()
	resultNames.value.forEach((name, idx) => {
		if (!resultIndexMap.has(name)) {
			resultIndexMap.set(name, [])
		}
		resultIndexMap.get(name)!.push(idx + 1)
	})
	
	return SIX_STARS.map(star => ({
		name: star.name as StarName,
		item: star,
		isHighlighted: resultIndexMap.has(star.name as StarName),
		positions: resultIndexMap.get(star.name as StarName) || [] // 所有出现的位置
	}))
})

const showDetails = ref(false)
function toggleDetails() {
	showDetails.value = !showDetails.value
}
</script>

<template>
	<div class="page">
		<header class="hero">
			<h1>小六壬 · 起课</h1>
			<p class="sub">随机或按时间一键起课，查看六星断词</p>
		</header>

		<section class="actions" aria-label="起课操作">
			<button class="btn" :class="{ primary: activeMode==='time' }" @click="rollByTime">时间起课</button>
			<button class="btn" :class="{ primary: activeMode==='random' }" @click="rollRandom">随机起课</button>
            <button class="btn slim" :class="{ primary: activeMode==='custom' }" @click="computeFromCustom">自定义起课</button>
			<div class="fields">
				<label class="field">
					<span>X</span>
					<input type="number" inputmode="numeric" min="1" placeholder=">= 1" v-model="customX" @input="handleInputChange" />
				</label>
				<label class="field">
					<span>Y</span>
					<input type="number" inputmode="numeric" min="1" placeholder=">= 1" v-model="customY" @input="handleInputChange" />
				</label>
				<label class="field">
					<span>Z</span>
					<input type="number" inputmode="numeric" min="1" placeholder=">= 1" v-model="customZ" @input="handleInputChange" />
				</label>
			</div>
		</section>

		<p v-if="errorMsg" class="error">{{ errorMsg }}</p>

		<!-- 加载动画 -->
		<div v-if="isLoading" class="loading">
			<div class="spinner"></div>
			<p>起课中...</p>
		</div>

		<section v-if="showResult && resultDetails.length" class="result">
			<div class="flow">
				<div v-for="r in resultDetails" :key="r.pos" class="step">
					<div class="card">
						<div class="tag">第 {{ r.pos }} 字</div>
						<div class="name">{{ r.name }}</div>
						<div class="element">{{ r.item.element }}</div>
					</div>
					<div v-if="r.pos < 3" class="arrow" aria-hidden="true">➜</div>
				</div>
			</div>

			<div class="details">
				<h2 class="collapsible" @click="toggleDetails">
					断词详解
					<span class="arrow" :class="{ open: showDetails }">{{ showDetails ? '▼' : '▶' }}</span>
				</h2>
				<transition name="fade">
				  <div v-if="showDetails" class="grid">
					  <article 
						  v-for="star in allStarsDetails" 
						  :key="'d-' + star.name" 
						  class="detail"
						  :class="{ highlighted: star.isHighlighted }"
					  >
						  <div class="detail-header">
							  <h3>{{ star.name }}</h3>
							  <div v-if="star.positions.length > 0" class="position-badges">
								  <span v-for="pos in star.positions" :key="pos" class="position-badge">第{{ pos }}字</span>
							  </div>
						  </div>
						  <p class="desc">{{ star.item.description }}</p>
					  </article>
				  </div>
				</transition>
			</div>
		</section>

		<footer class="foot">仅作民俗参考，不作决策依据。</footer>
	</div>
</template>

<style>
/* 全局重置：移除浏览器默认的 body margin（常见为 8px） */
body { margin: 0; }
</style>

<style scoped>
.page {
	/* 主题变量（放在容器上，确保 scoped 生效） */
	--bg: #0b1020;
	--panel: rgba(255, 255, 255, 0.06);
	--panel-strong: rgba(255, 255, 255, 0.12);
	--text: #e8ecf7;
	--muted: #a9b3c7;
	--primary: #7c9cff;
	--primary-2: #5f86ff;
	--glow: 0 0 40px rgba(124, 156, 255, 0.35);

	min-height: 100dvh;
	background:
		radial-gradient(1200px 600px at 80% -10%, rgba(124,156,255,0.25), transparent 60%),
		radial-gradient(1000px 400px at 0% 100%, rgba(106, 255, 202, 0.15), transparent 60%),
		var(--bg);
	color: var(--text);
	display: grid;
	grid-template-rows: auto auto auto 1fr auto;
	place-items: center;
	padding: 16px 12px 28px;
}

.hero {
	text-align: center;
	margin-top: 4px;
}
.hero h1 {
	font-weight: waitTime;
	letter-spacing: 0.02em;
	font-size: clamp(22px, 3.2vw, 34px);
	margin: 0;
}
.hero .sub {
	margin-top: 4px;
	color: var(--muted);
}

.actions { display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; justify-content: center; align-items: end; }
.btn {
	appearance: none;
	border: 1px solid var(--panel-strong);
	background: linear-gradient(160deg, var(--panel), transparent);
	color: var(--text);
	padding: 8px 12px;
	border-radius: 10px;
	cursor: pointer;
	font-weight: 600;
	transition: transform .12s ease, box-shadow .2s ease, background .2s ease;
	box-shadow: 0 6px 20px rgba(0,0,0,.2);
}
.btn:hover { transform: translateY(-1px); box-shadow: var(--glow); }
.btn:active { transform: translateY(0); }
.btn.primary {
	background: linear-gradient(160deg, var(--primary-2), var(--primary));
	border-color: transparent;
	box-shadow: 0 6px 24px rgba(124,156,255,0.45);
}

.inputs { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: center; }
.pill {
	background: var(--panel);
	border: 1px solid var(--panel-strong);
	padding: 4px 8px;
	border-radius: 999px;
	color: var(--muted);
}
.pill strong { color: var(--text); margin-left: 2px; }

.error { color: #ffb3b3; margin-top: 6px; }

.loading {
	margin-top: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	color: var(--muted);
}
.spinner {
	width: 40px;
	height: 40px;
	border: 3px solid var(--panel-strong);
	border-top-color: var(--primary);
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}
@keyframes spin {
	to { transform: rotate(360deg); }
}
.loading p {
	margin: 0;
	font-size: 14px;
	animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
	0%, 100% { opacity: 0.6; }
	50% { opacity: 1; }
}

.fields { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(120px, auto); gap: 8px; }
.field { display: grid; gap: 4px; text-align: left; }
.field span { font-size: 12px; color: var(--muted); }
.field input {
	appearance: none;
	background: var(--panel);
	border: 1px solid var(--panel-strong);
	color: var(--text);
	padding: 8px 10px;
	border-radius: 10px;
	outline: none;
	min-width: 110px;
}
.field input:focus {
	border-color: var(--primary);
	box-shadow: 0 0 0 3px rgba(124,156,255,0.25);
}
.btn.slim { padding: 8px 10px; }

.result { width: min(100%, 1000px); margin-top: 14px; }
.flow { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 10px; align-items: center; }
.step { display: contents; }
.card {
	padding: 12px;
	background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
	border: 1px solid var(--panel-strong);
	border-radius: 14px;
	backdrop-filter: blur(6px);
	min-height: 80px;
	display: grid;
	grid-template-rows: auto auto 1fr;
	gap: 4px;
}
.tag {
	display: inline-block;
	font-size: 11px;
	color: var(--muted);
	padding: 3px 6px;
	border-radius: 999px;
	background: rgba(255,255,255,0.06);
	width: fit-content;
}
.name { font-size: 24px; font-weight: waitTime; letter-spacing: 0.02em; }
.element { color: var(--muted); font-size: 13px; }
.arrow { text-align: center; font-size: 18px; color: var(--muted); }

.details { margin-top: 18px; }
.details .collapsible {
	font-size: 16px;
	color: var(--muted);
	font-weight: 700;
	cursor: pointer;
	user-select: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	transition: color .2s;
}
.details .collapsible:hover {
	color: var(--primary);
}
.details .arrow {
	font-size: 16px;
	transition: transform .2s;
	display: inline-block;
}
.details .arrow.open {
	transform: rotate(180deg);
}
.fade-enter-active, .fade-leave-active {
	transition: opacity .25s;
}
.fade-enter-from, .fade-leave-to {
	opacity: 0;
}
.grid {
	margin-top: 8px;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 10px;
}
.detail {
	padding: 12px 12px;
	border: 1px solid var(--panel-strong);
	border-radius: 12px;
	background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
	transition: all 0.3s ease;
}
.detail.highlighted {
	border-color: var(--primary);
	background: linear-gradient(160deg, rgba(124,156,255,0.2), rgba(124,156,255,0.1));
	box-shadow: 0 0 20px rgba(124,156,255,0.3);
}
.detail-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 4px;
	gap: 8px;
}
.detail h3 { margin: 0; font-size: 15px; }
.position-badges {
	display: flex;
	gap: 4px;
	flex-wrap: wrap;
}
.position-badge {
	font-size: 11px;
	color: var(--primary);
	background: rgba(124,156,255,0.2);
	padding: 2px 8px;
	border-radius: 999px;
	font-weight: 600;
	white-space: nowrap;
}
.detail .desc { margin: 0; color: var(--text); opacity: 0.92; line-height: 1.6; }

.foot { margin-top: 16px; color: var(--muted); font-size: 12px; text-align: center; }

/* 平板：2 列，进一步压缩间距 */
@media (max-width: 1024px) {
	.grid { grid-template-columns: repeat(2, 1fr); }
	.result { width: min(100%, 900px); }
}

/* 手机：1 列，垂直流式 */
@media (max-width: 720px) {
	.grid { grid-template-columns: 1fr; }
	.flow { grid-auto-flow: row; grid-auto-rows: auto; }
	.arrow { transform: rotate(90deg); }
	.hero h1 { font-size: clamp(20px, 6vw, 28px); }
	.actions { justify-content: stretch; }
	.fields { grid-auto-flow: row; width: 100%; }
	/* .field input { width: 100%; } */
}
</style>