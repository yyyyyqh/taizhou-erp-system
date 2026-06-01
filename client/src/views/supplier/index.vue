<template>
  <div class="supplier-container">
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
            >🤝 供应商主数据档案 (SRM Base)</span
          >
          <el-button type="primary" icon="Plus" @click="dialogVisible = true"
            >新增供应商</el-button
          >
        </div>
      </template>

      <el-table :data="supplierList" border stripe v-loading="loading">
        <el-table-column prop="code" label="供应商编码" width="150" />
        <el-table-column prop="name" label="供应商全称" min-width="200" />
        <el-table-column prop="contactName" label="联系人" width="150" />
        <el-table-column prop="contactPhone" label="联系电话" width="180" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ scope.row.status === "ACTIVE" ? "合作中" : "已冻结" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="建档时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleDateString() }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="建立供应商战略档案" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="供应商全称" required>
          <el-input
            v-model="form.name"
            placeholder="请录入工商注册全称，防对账冲突"
          />
        </el-form-item>
        <el-form-item label="核心联系人">
          <el-input v-model="form.contactName" placeholder="如：张总" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhone" placeholder="手机或固话" />
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
import { getSuppliersApi, createSupplierApi } from "../../api/index";

const supplierList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitLoading = ref(false);

const form = reactive({ name: "", contactName: "", contactPhone: "" });

const fetchSuppliers = async () => {
  loading.value = true;
  try {
    const res = await getSuppliersApi();
    if (res.success) supplierList.value = res.data;
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.name.trim()) return ElMessage.warning("供应商名称不能为空");
  submitLoading.value = true;
  try {
    const res = await createSupplierApi(form);
    if (res.success) {
      ElMessage.success("供应商档案建立成功");
      dialogVisible.value = false;
      form.name = "";
      form.contactName = "";
      form.contactPhone = "";
      fetchSuppliers();
    }
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => {
  fetchSuppliers();
});
</script>

<style scoped>
.supplier-container {
  padding: 10px;
}
</style>
