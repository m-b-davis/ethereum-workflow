var Workflow = artifacts.require("Workflow");

contract('Workflow', function(accounts) {

  // Get accounts
  var account2 = accounts[1];
  var account3 = accounts[2];
  var account4 = accounts[3];
  var account5 = accounts[4];

  var workflowSteps = [
    {name: "Bid ready", approvalsRequired: 3},
    {name: "Project phase 1 complete", approvalsRequired: 2},
    {name: "Project complete", approvalsRequired: 3}
  ]

  it("should start in workflow state 0", function() {
      return Workflow.deployed().then(function(instance) {
        return instance.stateIndex.call();
      }).then(function(stateIndex) {
        assert.equal(stateIndex.valueOf(), 0, "0 wasn't the starting index");
      });
  });

  it("should start with 0 stakeholders", function() {
      return Workflow.deployed().then(function(instance) {
        return instance.stakeholderCount.call();
      }).then(function(stakeholderCount) {
        assert.equal(stakeholderCount.toNumber(), 0, "workflow started with more than 0 stakeholders");
      });
  });

  it("should be able to add workflow step 1", function() {
      return Workflow.deployed().then(function(instance) {
        workflow = instance;
        var firstState = workflowSteps[0];
        return workflow.addWorkflowState(firstState.name, firstState.approvalsRequired);
      }).then(function() {
        return workflow.finalStateIndex.call();
      }).then(function(finalStateIndex) {
        assert.equal(finalStateIndex.toNumber(), 1, "Index of final state should now be 1");
      });
  });

  it("should be able to add workflow step 2", function() {
      return Workflow.deployed().then(function(instance) {
        workflow = instance;
        var secondState = workflowSteps[1];
        return workflow.addWorkflowState(secondState.name, secondState.approvalsRequired);
      }).then(function() {
        return workflow.finalStateIndex.call();
      }).then(function(finalStateIndex) {
        assert.equal(finalStateIndex.toNumber(), 2, "Index of final state should now be 2");
      });
  });

  it("should be able to add workflow step 3", function() {
      return Workflow.deployed().then(function(instance) {
        workflow = instance;
        var thirdState = workflowSteps[2];
        return workflow.addWorkflowState(thirdState.name, thirdState.approvalsRequired);
      }).then(function() {
        return workflow.finalStateIndex.call();
      }).then(function(finalStateIndex) {
        assert.equal(finalStateIndex.toNumber(), 3, "Index of final state should now be 3");
      });
  });

  it("should be able to add a stakeholder", function() {
    return Workflow.deployed().then(function(instance) {
      workflow = instance
      // Get account
      var account_two = accounts[1];

      return workflow.addStakeholder(account_two, 0);
    }).then(function(){
        return workflow.stakeholderCount.call()
    }).then(function(stakeholderCount) {
      assert.equal(stakeholderCount.toNumber(), 1, "workflow stakeholder count should be 1 ");
    });
  });

  it("should be able to add multiple stakeholders", function() {
    return Workflow.deployed().then(function(instance) {
      workflow = instance
      return workflow.addStakeholders([account3, account4, account5], 0);
    }).then(function(){
        return workflow.stakeholderCount.call()
    }).then(function(stakeholderCount) {
      assert.equal(stakeholderCount.toNumber(), 4, "workflow stakeholder count should now be 4 ");
    });
  });

  it("Stakeholders should be able to approve, and an event should be fired when they do", function() {
    return Workflow.deployed().then(function(instance) {
      workflow = instance
      return workflow.approve({from: account2})
    }).then(function(result){
        var event = result.logs[0];

        /*
        Logs is an array with elements in the following format:

        { logIndex: 0,
          transactionIndex: 0,
          transactionHash: '0x845e70b254b1738f1afcef257d5e12ca91a0e8af9689f714258bca0848c26ecc',
          blockHash: '0x4c41814d3de3ea27acaa14b9e916c9d3f1a6db80fa1ca15f3c42d0d12c22bd8d',
          blockNumber: 69,
          address: '0x40380e14ddbf6df4cdd6ea249e9bc825c5dd9521',
          type: 'mined',
          event: 'ApprovalMade',
          args: { stakeholderName: 'Anonymous' } }
        }
        */

        assert.equal(event.event, "ApprovalMade", "Expected ApprovalMade event");
        assert.equal(event.args.stakeholderName, "Anonymous");

        return workflow.getCurrentStateApprovalCount.call()
    }).then(function(approvalCount) {
      assert.equal(approvalCount.toNumber(), 1, "Approval count should now be 1");
    });
  });

  it("It should be possible to add a nickname for a stakeholder, then this name should be shown in the approval event", function() {
    var account3Nickname = "Project Manager";
    return Workflow.deployed().then(function(workflow) {
      return workflow.setNickname(account3Nickname, {from: account3}); // Account 3 is a project manager
    }).then(function() {
      return workflow.approve({from: account3})
    }).then(function(result){
        var event = result.logs[0];
        assert.equal(event.event, "ApprovalMade", "Expected ApprovalMade event");
        assert.equal(event.args.stakeholderName, account3Nickname, "When account3 makes an approval, the approval event should state they are a project manager");

        return workflow.getCurrentStateApprovalCount.call()
    });
  });

  it("A third approval should trigger moving into workflow state 1", function() {
    return Workflow.deployed().then(function(workflow) {
      return workflow.approve({from: account4})
    }).then(function(result){
        var event = result.logs[1];

        assert.equal(event.event, "StateChanged", "Expected StateChanged event");
        assert.equal(event.args.newStateIndex, 1, "Expected new workflow state index to be 1");
        assert.equal(event.args.newStateName, workflowSteps[1].name, "Expected new workflow state name to equal " + workflowSteps[1].name);

        return workflow.getCurrentStateApprovalCount.call()
    });
  });
});
