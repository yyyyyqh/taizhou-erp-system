<template>
  <div class="warehouse-container">
    <el-card>
      <template #header>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <span style="font-weight: bold; font-size: 16px"
            >🏢 物理仓储网络主数据 (WMS Base)</span
          >
          <el-button type="primary" icon="Plus" @click="dialogVisible = true"
            >新增物理仓</el-button
          >
        </div>
      </template>

      <el-table
        :data="warehouseList"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="code" label="仓库编码" width="180" />
        <el-table-column prop="name" label="仓库名称" min-width="200" />
        <el-table-column prop="type" label="核心业务属性属性" width="220">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.type === 'MAIN'
                  ? 'primary'
                  : scope.row.type === 'WIP'
                    ? 'warning'
                    : 'success'
              "
            >
              {{
                scope.row.type === "MAIN"
                  ? "原材料大仓 (MAIN)"
                  : scope.row.type === "WIP"
                    ? "车间线边仓 (WIP)"
                    : "成品发货仓 (FG)"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="建档时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleDateString() }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增物理/逻辑仓库" width="460px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="仓库编码" required>
          <el-input
            v-model="form.code"
            placeholder="如: WH-MAIN-01, WH-WIP-01"
          />
        </el-form-item>
        <el-form-item label="仓库名称" required>
          <el-input
            v-model="form.name"
            placeholder="如: 一号原材料大仓、组装车间线边仓"
          />
        </el-form-item>
        <el-form-item label="核心属性" required>
          <el-select
            v-model="form.type"
            placeholder="请选择核心业务属性"
            style="width: 100%"
          >
            <el-option label="原材料大仓 (MAIN - 接收采购入库)" value="MAIN" />
            <el-option label="车间线边仓 (WIP - 生产领料配料)" value="WIP" />
            <el-option label="成品发货仓 (FG - 完工入库与销售)" value="FG" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"
          >保存入库</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getWarehousesApi, createWarehouseApi } from "../../api/index";

const warehouseList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitLoading = ref(false);

const form = reactive({ code: "", name: "", type: "MAIN" });

const fetchWarehouses = async () => {
  loading.value = true;
  try {
    const res = await getWarehousesApi();
    if (res.success) {
      warehouseList.value = res.data;
    }
  } catch (error) {
    ElMessage.error("获取仓库列表失败，请检查网络或后端接口");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.code.trim() || !form.name.trim()) {
    return ElMessage.warning("仓库编码与名称不能为空");
  }
  submitLoading.value = true;
  try {
    const res = await createWarehouseApi(form);
    if (res.success) {
      ElMessage.success("仓库网络主数据配置成功");
      dialogVisible.value = false;
      form.code = "";
      form.name = "";
      fetchWarehouses();
    } else {
      ElMessage.error(res.message || "配置失败");
    }
  } catch (error) {
    ElMessage.error("网络响应异常");
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => {
  fetchWarehouses();
});
</script>

<style scoped>
.warehouse-container {
  padding: 10px;
}
</style>
