import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  template: `
    <div class="flex items-center justify-center h-screen bg-[#0a0b0f]">
      <div class="text-center">
        <div class="animate-spin w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-[#e2e8f0]">Completing authentication...</p>
      </div>
    </div>
  `,
})
export class AgentCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const salt = params['salt'];
      const address = params['address'];
      const state = params['state'];

      if (state && token && salt && address) {
        // Store result for the opener window to pick up
        sessionStorage.setItem(`zklogin_agent_result_${state}`, JSON.stringify({ token, salt, address }));
      }

      // Close this popup
      window.close();
    });
  }
}
