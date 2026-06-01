<template>
  <el-container class="layout-container">
    <el-aside width="210px" class="aside">
      <div class="logo">台账 ERP 系统</div>
      <el-menu
        active-text-color="#409EFF"
        background-color="#304156"
        class="el-menu-vertical"
        default-active="/dashboard"
        text-color="#bfcbd9"
        router
      >
        <el-menu-item index="/dashboard">
          <span>📊 宏观数据大盘</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <span>商品与库存管理</span>
        </el-menu-item>
        <el-menu-item index="/bom">
          <span>BOM 物料清单设计</span>
        </el-menu-item>
        <el-menu-item index="/mrp">
          <span>MRP 运算与计划排程</span>
        </el-menu-item>
        <el-menu-item index="/purchase">
          <span>采购单 (PO) 管理</span>
        </el-menu-item>
        <el-menu-item index="/production">
          <span>生产工单 (PrdO) 管理</span>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <span>📦 实时物理库存视图</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-right">
          <el-avatar
            size="small"
            src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
          />
          <span class="username">管理员</span>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts"></script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
}

.aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b3643;
  letter-spacing: 1px;
}

.el-menu-vertical {
  border-right: none;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #333;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
