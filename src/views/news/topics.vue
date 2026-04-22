<template>
  <div class="topics-page">
    <!-- 顶部控制栏 -->
    <el-card class="control-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-radio-group v-model="topicMode" @change="handleModeChange">
            <el-radio-button label="current">当前榜单</el-radio-button>
            <el-radio-button label="daily">当日汇总</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="8">
          <el-select v-model="topN" placeholder="显示数量" @change="loadTopics">
            <el-option label="Top 10" :value="10" />
            <el-option label="Top 20" :value="20" />
            <el-option label="Top 50" :value="50" />
            <el-option label="Top 100" :value="100" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="loadTopics" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 热门话题列表 -->
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>热门话题</span>
          <el-tag type="info">{{ topicMode === 'current' ? '当前榜单' : '当日汇总' }}</el-tag>
        </div>
      </template>

      <el-empty v-if="topics.length === 0" description="暂无热门话题" />

      <div v-else class="topics-container">
        <!-- 话题排名列表 -->
        <div class="topics-rank-section">
          <div
            v-for="(topic, index) in topics"
            :key="topic.word"
            class="topic-rank-item"
            :class="{'top-3': index < 3}"
            @click="expandTopic(topic)"
          >
            <div class="rank-badge" :class="getRankClass(index)">
              {{ index + 1 }}
            </div>
            <div class="topic-content">
              <div class="topic-word">{{ topic.word }}</div>
              <div class="topic-stats">
                <span class="topic-count">{{ topic.count }}条新闻</span>
                <span v-if="topic.percentage" class="topic-percentage">
                  {{ topic.percentage.toFixed(1) }}%
                </span>
              </div>
            </div>
            <div class="topic-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>

        <!-- 展开的话题详情 -->
        <div v-if="expandedTopic" class="topic-detail-section">
          <el-card class="topic-detail-card">
            <template #header>
              <div class="detail-header">
                <h3>{{ expandedTopic.word }}</h3>
                <el-button link @click="closeDetail">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </template>

            <div class="detail-stats">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-label">新闻数量</div>
                    <div class="stat-value">{{ expandedTopic.count }}</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-label">占比</div>
                    <div class="stat-value">{{ expandedTopic.percentage ? expandedTopic.percentage.toFixed(1) + '%' : '-' }}</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-label">排名</div>
                    <div class="stat-value">{{ expandedTopicRank }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>

            <el-divider content-position="left">相关新闻</el-divider>

            <div class="topic-news-list">
              <div
                v-for="item in expandedTopic.titles"
                :key="item.title"
                class="topic-news-item"
              >
                <div class="news-checkbox">
                  <el-checkbox />
                </div>
                <div class="news-content">
                  <div class="news-title-line">
                    <a :href="item.url" target="_blank" rel="noopener noreferrer">
                      {{ item.title }}
                    </a>
                    <el-tag v-if="item.is_new" size="small" type="success">新增</el-tag>
                  </div>
                  <div class="news-meta-line">
                    <span class="source">{{ item.source_name }}</span>
                    <span class="time">{{ formatTime(item.time_display) }}</span>
                    <span v-if="item.count > 1" class="count">出现 {{ item.count }} 次</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useNewsStore } from '@/stores/news'
import type { Topic } from '@/types'

const newsStore = useNewsStore()

// 状态
const topicMode = ref('current')
const topN = ref(10)
const loading = ref(false)
const topics = ref<Topic[]>([])
const expandedTopic = ref<Topic | null>(null)
const expandedTopicRank = computed(() =>
  expandedTopic.value ? topics.value.findIndex(t => t.word === expandedTopic.value?.word) + 1 : '-'
)

// 加载话题
async function loadTopics() {
  loading.value = true
  try {
    await newsStore.fetchTrendingTopics(topN.value, topicMode.value)
    topics.value = newsStore.topics
  } catch (error: any) {
    ElMessage.error('加载话题失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 模式切换
function handleModeChange() {
  loadTopics()
}

// 展开话题详情
function expandTopic(topic: Topic) {
  expandedTopic.value = topic
}

// 关闭详情
function closeDetail() {
  expandedTopic.value = null
}

// 获取排名样式类
function getRankClass(index: number): string {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  if (index < 10) return 'rank-top10'
  return 'rank-normal'
}

// 格式化时间
function formatTime(timeStr: string): string {
  if (!timeStr) return '-'
  return timeStr
}

// 初始化
onMounted(() => {
  loadTopics()
})
</script>

<style scoped>
.topics-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.control-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topics-container {
  padding: 10px 0;
}

/* 话题排名部分 */
.topics-rank-section {
  margin-bottom: 20px;
}

.topic-rank-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.topic-rank-item:hover {
  background-color: var(--el-fill-color);
  transform: translateX(4px);
}

.topic-rank-item.top-3 {
  background: linear-gradient(135deg, var(--el-fill-color-light) 0%, var(--el-fill-color) 100%);
}

.rank-badge {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  margin-right: 16px;
  flex-shrink: 0;
}

.rank-1 {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.rank-2 {
  background: linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
}

.rank-3 {
  background: linear-gradient(135deg, #CD7F32 0%, #8B4513 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
}

.rank-top10 {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.rank-normal {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.topic-content {
  flex: 1;
  min-width: 0;
}

.topic-word {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.topic-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.topic-count {
  display: flex;
  align-items: center;
}

.topic-percentage {
  display: flex;
  align-items: center;
}

.topic-arrow {
  color: var(--el-text-color-secondary);
  transition: transform 0.3s;
}

.topic-rank-item:hover .topic-arrow {
  transform: translateX(4px);
}

/* 话题详情部分 */
.topic-detail-section {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.topic-detail-card {
  margin-top: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
}

.detail-stats {
  padding: 20px 0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.topic-news-list {
  padding: 10px 0;
}

.topic-news-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.topic-news-item:hover {
  background-color: var(--el-fill-color-light);
}

.news-checkbox {
  flex-shrink: 0;
  margin-right: 12px;
  margin-top: 2px;
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.news-title-line a {
  color: var(--el-text-color-primary);
  text-decoration: none;
  font-size: 14px;
}

.news-title-line a:hover {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.news-meta-line {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.source {
  display: flex;
  align-items: center;
}

.time {
  display: flex;
  align-items: center;
}

.count {
  display: flex;
  align-items: center;
}
</style>
