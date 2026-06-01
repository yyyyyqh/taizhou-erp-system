import { createRouter, createWebHistory } from "vue-router";
import Layout from "../layout/index.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Layout,
      redirect: "/products",
      children: [
        {
          path: "products",
          name: "Products",
          component: () => import("../views/products/index.vue"),
        },
        {
          path: "bom",
          name: "Bom",
          component: () => import("../views/bom/index.vue"),
        },
        {
          path: "mrp",
          name: "Mrp",
          component: () => import("../views/mrp/index.vue"),
        },
        {
          path: "purchase",
          name: "Purchase",
          component: () => import("../views/purchase/index.vue"),
        },
        {
          path: "production",
          name: "Production",
          component: () => import("../views/production/index.vue"),
        },
      ],
    },
  ],
});

export default router;
